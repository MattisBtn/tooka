import { serverSupabaseClient } from "#supabase/server";
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
        statusMessage: "ID de moodboard requis",
      });
    }

    try {
      const supabase = await serverSupabaseClient(event);

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
            statusMessage: "Moodboard non trouvé",
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
          statusMessage: "Moodboard non accessible",
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

      // Process reactions - group by image and count by type
      const imagesWithReactions = (imagesData || []).map((image) => {
        const reactionCounts = { love: 0, like: 0, dislike: 0 };

        if (image.reactions) {
          image.reactions.forEach(
            (reaction: { reaction_type: "love" | "like" | "dislike" }) => {
              reactionCounts[reaction.reaction_type]++;
            }
          );
        }

        // Return image without raw reactions array, only processed counts
        const { reactions: _, ...imageWithoutReactions } = image;

        return {
          ...imageWithoutReactions,
          reactions: reactionCounts,
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
        statusMessage: "Erreur serveur",
      });
    }
  }
);
