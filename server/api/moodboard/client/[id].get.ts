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

      // Single query with JOIN to get moodboard + project + images count
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

      // Check if moodboard is accessible to clients
      if (
        moodboard.status !== "awaiting_client" &&
        moodboard.status !== "completed" &&
        moodboard.status !== "revision_requested"
      ) {
        throw createError({
          statusCode: 403,
          statusMessage: "Moodboard non accessible",
        });
      }

      // Get paginated moodboard images with total count and comments
      const [imagesResult, countResult] = await Promise.all([
        supabase
          .from("moodboard_images")
          .select(
            `
            *,
            comments:moodboard_comments(*)
          `
          )
          .eq("moodboard_id", moodboard.id)
          .order("created_at", { ascending: true })
          .range(offset, offset + pageSize - 1),

        supabase
          .from("moodboard_images")
          .select("id", { count: "exact" })
          .eq("moodboard_id", moodboard.id),
      ]);

      if (imagesResult.error) {
        throw new Error(
          `Failed to fetch moodboard images: ${imagesResult.error.message}`
        );
      }

      if (countResult.error) {
        throw new Error(
          `Failed to count moodboard images: ${countResult.error.message}`
        );
      }

      // Type assertion pour le projet
      const projectData = moodboard.project as {
        id: string;
        title: string;
        description: string | null;
        password_hash: string;
        status: string;
      };

      const totalImages = countResult.count || 0;
      const hasMore = offset + pageSize < totalImages;

      // Return minimal project info (no sensitive data) + paginated moodboard
      const result: ClientMoodboardAccess = {
        project: {
          id: moodboard.project_id,
          title: projectData.title,
          description: projectData.description,
          hasPassword: !!projectData.password_hash,
        },
        moodboard: {
          ...moodboard,
          images: imagesResult.data || [],
          imageCount: totalImages,
          hasMore,
          currentPage: page,
        },
      };

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }

      // Handle unknown errors
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur serveur",
      });
    }
  }
);
