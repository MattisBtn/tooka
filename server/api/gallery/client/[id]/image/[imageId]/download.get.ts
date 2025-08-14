import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const galleryId = getRouterParam(event, "id");
  const imageId = getRouterParam(event, "imageId");

  if (!galleryId) {
    throw createError({
      statusCode: 400,
      message: "ID de galerie requis",
    });
  }

  if (!imageId) {
    throw createError({
      statusCode: 400,
      message: "ID d'image requis",
    });
  }

  try {
    const supabase = await serverSupabaseServiceRole(event);

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
        message: "Galerie non trouvée",
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

    // Get the specific image
    const { data: image, error: imageError } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("id", imageId)
      .eq("gallery_id", galleryId)
      .single();

    if (imageError || !image) {
      throw createError({
        statusCode: 404,
        message: "Image non trouvée dans cette galerie",
      });
    }

    // Download image from Supabase Storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from("gallery-images")
      .download(image.file_url);

    if (downloadError || !imageData) {
      throw createError({
        statusCode: 500,
        message: "Erreur lors du téléchargement de l'image",
      });
    }

    // Extract file extension and create clean filename
    const fileExtension = image.file_url.split(".").pop() || "jpg";
    const projectTitle =
      (gallery.project as { title?: string })?.title || "Galerie";
    const cleanTitle = projectTitle.replace(/[^a-zA-Z0-9\-_]/g, "_");
    const fileName = `${cleanTitle}_${image.id.substring(
      0,
      8
    )}.${fileExtension}`;

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await imageData.arrayBuffer();

    // Set response headers for file download
    setHeader(event, "Content-Type", imageData.type || "image/jpeg");
    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );
    setHeader(event, "Content-Length", arrayBuffer.byteLength);
    setHeader(event, "Cache-Control", "no-cache");

    // Return the image buffer
    return new Uint8Array(arrayBuffer);
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
});
