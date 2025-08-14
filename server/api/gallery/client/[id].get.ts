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
            remaining_amount,
            payment_method,
            user_id
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

      // Generate signed URLs for all images (only if there are images)
      const filepaths = (imagesResult.data || []).map((img) => img.file_url);
      let signedUrlsData: { path: string | null; signedUrl: string }[] = [];

      if (filepaths.length > 0) {
        const { data: urls, error: signedUrlsError } = await supabase.storage
          .from("gallery-images")
          .createSignedUrls(filepaths, 3600);

        if (signedUrlsError) {
          throw new Error(
            `Failed to generate signed URLs: ${signedUrlsError.message}`
          );
        }
        signedUrlsData = urls || [];
      }

      // Add signed URLs to images
      const imagesWithSignedUrls = (imagesResult.data || []).map((image) => {
        // Find signed URL for this image
        const signedUrlData = signedUrlsData.find(
          (urlData) => urlData.path === image.file_url
        );

        return {
          ...image,
          signed_url: signedUrlData?.signedUrl || null,
        };
      });

      // Type assertion pour le projet
      const projectData = gallery.project as {
        id: string;
        title: string;
        description: string | null;
        password_hash: string;
        status: string;
        remaining_amount: number;
        payment_method: "stripe" | "bank_transfer" | null;
        user_id: string;
      };

      // Fetch bank details from user_profiles if payment_method is bank_transfer
      let bankDetails = undefined;
      if (projectData.payment_method === "bank_transfer") {
        const { data: userProfile, error: userProfileError } = await supabase
          .from("user_profiles")
          .select("bank_account_holder, bank_bic, bank_iban, bank_name")
          .eq("id", projectData.user_id)
          .single();

        if (userProfileError) {
          console.error(
            "[DEBUG] Gallery API - User profile query error:",
            userProfileError
          );
        }

        if (
          userProfile?.bank_iban &&
          userProfile?.bank_bic &&
          userProfile?.bank_account_holder
        ) {
          bankDetails = {
            iban: userProfile.bank_iban,
            bic: userProfile.bank_bic,
            beneficiary: userProfile.bank_account_holder,
            reference: `GAL-${galleryId
              .slice(0, 8)
              .toUpperCase()}-${Date.now()}`,
          };
        }
      }

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
          paymentMethod: projectData.payment_method,
          bankDetails,
        },
        gallery: {
          ...gallery,
          images: imagesWithSignedUrls,
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
