import { serverSupabaseServiceRole } from "#supabase/server";
import type { ClientGalleryAccess } from "~/types/gallery";

export default defineEventHandler(
  async (event): Promise<ClientGalleryAccess> => {
    const galleryId = getRouterParam(event, "id");
    const query = getQuery(event);

    // Pagination parameters
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    if (!galleryId) {
      throw createError({
        statusCode: 400,
        message: "ID de galerie requis",
      });
    }

    try {
      const supabase = await serverSupabaseServiceRole(event);

      // Single query with JOIN to get gallery + project + images count
      const { data: gallery, error } = await supabase
        .from("galleries")
        .select(
          `
          *,
          project:projects(
            id,
            title,
            description,
            password_hash,
            status,
            remaining_amount
          )
        `
        )
        .eq("id", galleryId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw createError({
            statusCode: 404,
            message: "Galerie non trouvée",
          });
        }
        throw new Error(`Failed to fetch gallery: ${error.message}`);
      }

      // Check if gallery is accessible to clients
      if (gallery.status === "draft") {
        throw createError({
          statusCode: 403,
          message: "Galerie non accessible",
        });
      }

      // Get paginated gallery images with total count
      const [imagesResult, countResult] = await Promise.all([
        supabase
          .from("gallery_images")
          .select("*")
          .eq("gallery_id", gallery.id)
          .order("created_at", { ascending: true })
          .range(offset, offset + pageSize - 1),

        supabase
          .from("gallery_images")
          .select("id", { count: "exact" })
          .eq("gallery_id", gallery.id),
      ]);

      if (imagesResult.error) {
        throw new Error(
          `Failed to fetch gallery images: ${imagesResult.error.message}`
        );
      }

      if (countResult.error) {
        throw new Error(
          `Failed to count gallery images: ${countResult.error.message}`
        );
      }

      // Type assertion pour le projet
      const projectData = gallery.project as {
        id: string;
        title: string;
        description: string | null;
        password_hash: string;
        status: string;
        remaining_amount: number;
      };

      const totalImages = countResult.count || 0;
      const hasMore = offset + pageSize < totalImages;

      // Return minimal project info (no sensitive data) + paginated gallery
      const result: ClientGalleryAccess = {
        project: {
          id: gallery.project_id,
          title: projectData.title,
          description: projectData.description,
          hasPassword: !!projectData.password_hash,
          remainingAmount: projectData.remaining_amount,
        },
        gallery: {
          ...gallery,
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
        message: "Erreur serveur",
      });
    }
  }
);
