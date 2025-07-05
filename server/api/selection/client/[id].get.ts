import { serverSupabaseClient } from "#supabase/server";
import type { ClientSelectionAccess } from "~/types/selection";

export default defineEventHandler(
  async (event): Promise<ClientSelectionAccess> => {
    const selectionId = getRouterParam(event, "id");
    const query = getQuery(event);

    // Pagination parameters
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    if (!selectionId) {
      throw createError({
        statusCode: 400,
        message: "ID de sélection requis",
      });
    }

    try {
      const supabase = await serverSupabaseClient(event);

      // Get selection with project info
      const { data: selection, error } = await supabase
        .from("selections")
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
        .eq("id", selectionId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw createError({
            statusCode: 404,
            message: "Sélection non trouvée",
          });
        }
        throw new Error(`Failed to fetch selection: ${error.message}`);
      }

      // Check accessibility
      if (
        !["awaiting_client", "completed", "revision_requested"].includes(
          selection.status
        )
      ) {
        throw createError({
          statusCode: 403,
          message: "Sélection non accessible",
        });
      }

      // Get images for the selection
      const { data: imagesData, error: imagesError } = await supabase
        .from("selection_images")
        .select("*")
        .eq("selection_id", selection.id)
        .order("created_at", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (imagesError) {
        throw new Error(`Failed to fetch images: ${imagesError.message}`);
      }

      // Get total count for pagination
      const { count } = await supabase
        .from("selection_images")
        .select("id", { count: "exact" })
        .eq("selection_id", selection.id);

      const projectData = selection.project as {
        id: string;
        title: string;
        description: string | null;
        password_hash: string;
        status: string;
      };
      const totalImages = count || 0;
      const hasMore = offset + pageSize < totalImages;

      const result: ClientSelectionAccess = {
        project: {
          id: selection.project_id,
          title: projectData.title,
          description: projectData.description,
          hasPassword: !!projectData.password_hash,
        },
        selection: {
          ...selection,
          images: imagesData || [],
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
