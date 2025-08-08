import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const moodboardId = getRouterParam(event, "id");
  const filepath = getRouterParam(event, "filepath");

  if (!moodboardId) {
    throw createError({
      statusCode: 400,
      message: "ID de moodboard requis",
    });
  }

  if (!filepath) {
    throw createError({
      statusCode: 400,
      message: "Chemin du fichier requis",
    });
  }

  try {
    const supabase = await serverSupabaseServiceRole(event);

    // Decode the filepath (it was encoded in the URL)
    const decodedFilepath = decodeURIComponent(filepath);

    // Verify moodboard exists and is accessible
    const { data: moodboard, error: moodboardError } = await supabase
      .from("moodboards")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          password_hash,
          status
        )
      `
      )
      .eq("id", moodboardId)
      .single();

    if (moodboardError) {
      if (moodboardError.code === "PGRST116") {
        throw createError({
          statusCode: 404,
          message: "Moodboard non trouvé",
        });
      }
      throw new Error(`Failed to fetch moodboard: ${moodboardError.message}`);
    }

    // Check if moodboard is accessible to clients
    if (
      moodboard.status !== "awaiting_client" &&
      moodboard.status !== "completed" &&
      moodboard.status !== "revision_requested"
    ) {
      throw createError({
        statusCode: 403,
        message: "Moodboard non accessible",
      });
    }

    // Verify the image belongs to this moodboard
    const { data: _image, error: imageError } = await supabase
      .from("moodboard_images")
      .select("id, file_url")
      .eq("moodboard_id", moodboardId)
      .eq("file_url", decodedFilepath)
      .single();

    if (imageError) {
      if (imageError.code === "PGRST116") {
        throw createError({
          statusCode: 404,
          message: "Image non trouvée",
        });
      }
      throw new Error(`Failed to verify image: ${imageError.message}`);
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("moodboard-images")
        .createSignedUrl(decodedFilepath, 3600, {
          transform: {
            width: 400,
            height: 400,
          },
        }); // 1 hour expiry

    if (signedUrlError) {
      throw createError({
        statusCode: 500,
        message: `Erreur génération URL: ${signedUrlError.message}`,
      });
    }

    return {
      signedUrl: signedUrlData.signedUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
  } catch (error) {
    // Re-throw known errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unknown errors
    throw createError({
      statusCode: 500,
      message: "Erreur lors de la génération de l'URL",
    });
  }
});
