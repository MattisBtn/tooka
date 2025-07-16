import { serverSupabaseClient } from "#supabase/server";
import JSZip from "jszip";

export default defineEventHandler(async (event) => {
  const galleryId = getRouterParam(event, "id");

  if (!galleryId) {
    throw createError({
      statusCode: 400,
      message: "ID de galerie requis",
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

    // Get all images for this gallery
    const { data: images, error: imagesError } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("gallery_id", galleryId)
      .order("created_at", { ascending: true });

    if (imagesError) {
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la récupération des images",
      });
    }

    if (!images || images.length === 0) {
      throw createError({
        statusCode: 404,
        message: "Aucune image trouvée dans cette galerie",
      });
    }

    // Create ZIP file
    const zip = new JSZip();
    const projectTitle =
      (gallery.project as { title?: string })?.title || "Galerie";

    // Clean project title for filename
    const cleanTitle = projectTitle.replace(/[^a-zA-Z0-9\-_]/g, "_");

    // Download each image and add to ZIP
    const downloadPromises = images.map(async (image, index) => {
      try {
        // Download image from Supabase Storage
        const { data: imageData, error: downloadError } = await supabase.storage
          .from("gallery-images")
          .download(image.file_url);

        if (downloadError) {
          console.error(
            `Failed to download image ${image.file_url}:`,
            downloadError
          );
          return null;
        }

        if (!imageData) {
          console.error(`No data received for image ${image.file_url}`);
          return null;
        }

        // Convert Blob to ArrayBuffer
        const arrayBuffer = await imageData.arrayBuffer();

        // Extract file extension from file_url
        const fileExtension = image.file_url.split(".").pop() || "jpg";

        // Create a clean filename with index for ordering
        const fileName = `${String(index + 1).padStart(
          3,
          "0"
        )}_${cleanTitle}_${image.id.substring(0, 8)}.${fileExtension}`;

        // Add file to ZIP
        zip.file(fileName, arrayBuffer);

        return fileName;
      } catch (error) {
        console.error(`Error processing image ${image.file_url}:`, error);
        return null;
      }
    });

    // Wait for all downloads to complete
    const downloadResults = await Promise.all(downloadPromises);
    const successfulDownloads = downloadResults.filter(
      (result) => result !== null
    );

    if (successfulDownloads.length === 0) {
      throw createError({
        statusCode: 500,
        message: "Aucune image n'a pu être téléchargée",
      });
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    });

    // Set response headers for file download
    const zipFileName = `${cleanTitle}_${
      new Date().toISOString().split("T")[0]
    }.zip`;

    setHeader(event, "Content-Type", "application/zip");
    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${zipFileName}"`
    );
    setHeader(event, "Content-Length", zipBuffer.length);
    setHeader(event, "Cache-Control", "no-cache");

    // Return the ZIP buffer
    return zipBuffer;
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
