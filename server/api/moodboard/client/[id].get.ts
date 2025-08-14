import { serverSupabaseServiceRole } from "#supabase/server";
import type { ClientMoodboardAccess } from "~/types/moodboard";

export default defineEventHandler(
  async (event): Promise<ClientMoodboardAccess> => {
    const moodboardId = getRouterParam(event, "id");
    const query = getQuery(event);

    // Pagination parameters
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    if (!moodboardId) {
      throw createError({
        statusCode: 400,
        message: "ID de moodboard requis",
      });
    }

    try {
      const supabase = await serverSupabaseServiceRole(event);

      // Get moodboard with project info
      const { data: moodboard, error } = await supabase
        .from("moodboards")
        .select(
          `
          *,
          project:projects(
            id,
            title,
            description,
            password_hash,
            status
          )
        `
        )
        .eq("id", moodboardId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw createError({
            statusCode: 404,
            message: "Moodboard non trouvé",
          });
        }
        throw new Error(`Failed to fetch moodboard: ${error.message}`);
      }

      // Check accessibility
      if (
        !["awaiting_client", "completed", "revision_requested"].includes(
          moodboard.status
        )
      ) {
        throw createError({
          statusCode: 403,
          message: "Moodboard non accessible",
        });
      }

      // Get images with comments and reactions in one optimized query
      const { data: imagesData, error: imagesError } = await supabase
        .from("moodboard_images")
        .select(
          `
          *,
          comments:moodboard_comments(*),
          reactions:moodboard_reactions(reaction_type)
        `
        )
        .eq("moodboard_id", moodboard.id)
        .order("created_at", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (imagesError) {
        throw new Error(`Failed to fetch images: ${imagesError.message}`);
      }

      // Get total count for pagination
      const { count } = await supabase
        .from("moodboard_images")
        .select("id", { count: "exact" })
        .eq("moodboard_id", moodboard.id);

      // Generate signed URLs for all images (only if there are images)
      const filepaths = (imagesData || []).map((img) => img.file_url);
      let signedUrlsData: { path: string | null; signedUrl: string }[] = [];

      if (filepaths.length > 0) {
        const { data: urls, error: signedUrlsError } = await supabase.storage
          .from("moodboard-images")
          .createSignedUrls(filepaths, 3600);

        if (signedUrlsError) {
          throw new Error(
            `Failed to generate signed URLs: ${signedUrlsError.message}`
          );
        }
        signedUrlsData = urls || [];
      }

      // Process reactions and add signed URLs
      const imagesWithReactions = (imagesData || []).map((image) => {
        const reactionCounts = { love: 0, like: 0, dislike: 0 };

        if (image.reactions) {
          image.reactions.forEach(
            (reaction: { reaction_type: "love" | "like" | "dislike" }) => {
              reactionCounts[reaction.reaction_type]++;
            }
          );
        }

        // Find signed URL for this image
        const signedUrlData = signedUrlsData.find(
          (urlData) => urlData.path === image.file_url
        );

        // Return image without raw reactions array, only processed counts and signed URL
        const { reactions: _, ...imageWithoutReactions } = image;

        return {
          ...imageWithoutReactions,
          reactions: reactionCounts,
          signed_url: signedUrlData?.signedUrl || null,
        };
      });

      const projectData = moodboard.project as {
        id: string;
        title: string;
        description: string | null;
        password_hash: string;
        status: string;
      };
      const totalImages = count || 0;
      const hasMore = offset + pageSize < totalImages;

      const result: ClientMoodboardAccess = {
        project: {
          id: moodboard.project_id,
          title: projectData.title,
          description: projectData.description,
          hasPassword: !!projectData.password_hash,
        },
        moodboard: {
          ...moodboard,
          images: imagesWithReactions,
          imageCount: totalImages,
          hasMore,
          currentPage: page,
        },
      };

      return result;
    } catch (error) {
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }

      throw createError({
        statusCode: 500,
        message: "Erreur serveur",
      });
    }
  }
);
