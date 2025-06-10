import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const galleryId = getRouterParam(event, "id");
  const encodedImagePath = getRouterParam(event, "imagePath");

  // Decode the image path since it comes from URL
  const imagePath = encodedImagePath
    ? decodeURIComponent(encodedImagePath)
    : null;

  if (!galleryId || !imagePath) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de galerie et chemin d'image requis",
    });
  }

  try {
    const supabase = await serverSupabaseClient(event);

    // First, verify the gallery exists and is accessible
    const { data: gallery, error: galleryError } = await supabase
      .from("galleries")
      .select("id, status")
      .eq("id", galleryId)
      .single();

    if (galleryError || !gallery) {
      throw createError({
        statusCode: 404,
        statusMessage: "Galerie non trouvée",
      });
    }

    // Check if gallery is accessible to clients
    if (
      gallery.status !== "awaiting_client" &&
      gallery.status !== "completed" &&
      gallery.status !== "revision_requested"
    ) {
      throw createError({
        statusCode: 403,
        statusMessage: "Galerie non accessible",
      });
    }

    // Verify the image belongs to this gallery
    const { data: image, error: imageError } = await supabase
      .from("gallery_images")
      .select("file_url")
      .eq("gallery_id", galleryId)
      .eq("file_url", imagePath)
      .single();

    if (imageError || !image) {
      throw createError({
        statusCode: 404,
        statusMessage: "Image non trouvée",
      });
    }

    // Generate signed URL (1 hour expiry)
    const { data, error } = await supabase.storage
      .from("gallery-images")
      .createSignedUrl(imagePath, 3600);

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur génération URL",
      });
    }

    // Return the signed URL
    return { signedUrl: data.signedUrl };
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
