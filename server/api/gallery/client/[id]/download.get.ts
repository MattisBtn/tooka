import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const galleryId = getRouterParam(event, "id");

  if (!galleryId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de galerie requis",
    });
  }

  try {
    const supabase = await serverSupabaseClient(event);

    // Get gallery with project info
    const { data: gallery, error: galleryError } = await supabase
      .from("galleries")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          status
        )
      `
      )
      .eq("id", galleryId)
      .single();

    if (galleryError || !gallery) {
      throw createError({
        statusCode: 404,
        statusMessage: "Galerie non trouvée",
      });
    }

    // Check if gallery is completed (validated)
    if (gallery.status !== "completed") {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Cette galerie n'est pas encore disponible au téléchargement",
      });
    }

    // Get all images for this gallery
    const { data: images, error: imagesError } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("gallery_id", galleryId)
      .order("created_at", { ascending: true });

    if (imagesError) {
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur lors de la récupération des images",
      });
    }

    if (!images || images.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Aucune image trouvée dans cette galerie",
      });
    }

    // TODO: Implement ZIP creation and download
    // For now, return information about what would be downloaded
    return {
      success: true,
      message: "Téléchargement en cours de préparation",
      gallery_id: galleryId,
      project_title:
        (gallery.project as { title?: string })?.title || "Galerie",
      total_images: images.length,
      download_url: `/api/gallery/client/${galleryId}/download-zip`, // Future endpoint
      // TODO: Generate actual ZIP file and return download URL
    };
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
});
