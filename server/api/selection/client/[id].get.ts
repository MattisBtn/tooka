import { serverSupabaseServiceRole } from "#supabase/server";
import type { ClientSelectionAccess } from "~/types/selection";

export default defineEventHandler(
  async (event): Promise<ClientSelectionAccess> => {
    const selectionId = getRouterParam(event, "id");
    const query = getQuery(event);

    // Pagination parameters
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    // Filter parameters
    const filters = {
      selected: query.selected === "true",
    };

    if (!selectionId) {
      throw createError({
        statusCode: 400,
        message: "ID de sélection requis",
      });
    }

    try {
      const supabase = await serverSupabaseServiceRole(event);

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
      if (selection.status === "draft") {
        throw createError({
          statusCode: 403,
          message: "Sélection non accessible",
        });
      }

      // Build base query for images
      let imagesQuery = supabase
        .from("selection_images")
        .select("*")
        .eq("selection_id", selection.id);

      // Apply filters at database level
      if (filters.selected) {
        imagesQuery = imagesQuery.eq("is_selected", true);
      }

      // Get total count for pagination
      let countQuery = supabase
        .from("selection_images")
        .select("*", { count: "exact", head: true })
        .eq("selection_id", selection.id);

      if (filters.selected) {
        countQuery = countQuery.eq("is_selected", true);
      }

      const { count: totalImages, error: countError } = await countQuery;

      if (countError) {
        throw new Error(`Failed to get image count: ${countError.message}`);
      }

      // Apply pagination and ordering
      const { data: imagesData, error: imagesError } = await imagesQuery
        .order("is_selected", { ascending: false }) // Selected images first
        .order("created_at", { ascending: true }) // Then by creation date
        .range(offset, offset + pageSize - 1);

      if (imagesError) {
        throw new Error(`Failed to fetch images: ${imagesError.message}`);
      }

      const projectData = selection.project as {
        id: string;
        title: string;
        description: string | null;
        password_hash: string;
        status: string;
      };
      const hasMore = offset + pageSize < (totalImages || 0);

      // Generate signed URLs for all images (only if there are images)
      const filepaths = (imagesData || []).map((img) => img.file_url);
      let signedUrlsData: { path: string | null; signedUrl: string }[] = [];

      if (filepaths.length > 0) {
        const { data: urls, error: signedUrlsError } = await supabase.storage
          .from("selection-images")
          .createSignedUrls(filepaths, 3600);

        if (signedUrlsError) {
          throw new Error(
            `Failed to generate signed URLs: ${signedUrlsError.message}`
          );
        }
        signedUrlsData = urls || [];
      }

      // Map images to include userSelected field and signed URLs for client compatibility
      const mappedImages = (imagesData || []).map((image) => {
        const signedUrlData = signedUrlsData.find(
          (urlData) => urlData.path === image.file_url
        );
        return {
          ...image,
          userSelected: image.is_selected,
          signed_url: signedUrlData?.signedUrl || null,
        };
      });

      const result: ClientSelectionAccess = {
        project: {
          id: selection.project_id,
          title: projectData.title,
          description: projectData.description,
          hasPassword: !!projectData.password_hash,
          maxImages:
            selection.max_media_selection === -1
              ? undefined
              : selection.max_media_selection,
          extraImagePrice: selection.extra_media_price
            ? selection.extra_media_price
            : undefined,
        },
        selection: {
          ...selection,
          images: mappedImages,
          imageCount: totalImages || 0,
          hasMore,
          currentPage: page,
          activeFilters: filters,
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
