import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const selectionId = getRouterParam(event, "id");
  const filepath = getRouterParam(event, "filepath");

  if (!selectionId) {
    throw createError({
      statusCode: 400,
      message: "ID de sélection requis",
    });
  }

  if (!filepath) {
    throw createError({
      statusCode: 400,
      message: "Chemin du fichier requis",
    });
  }

  try {
    const supabase = await serverSupabaseClient(event);

    // Decode the filepath (it was encoded in the URL)
    const decodedFilepath = decodeURIComponent(filepath);

    // Verify selection exists and is accessible
    const { data: selection, error: selectionError } = await supabase
      .from("selections")
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
      .eq("id", selectionId)
      .single();

    if (selectionError) {
      if (selectionError.code === "PGRST116") {
        throw createError({
          statusCode: 404,
          message: "Sélection non trouvée",
        });
      }
      throw new Error(`Failed to fetch selection: ${selectionError.message}`);
    }

    // Check if selection is accessible to clients
    if (selection.status === "draft") {
      throw createError({
        statusCode: 403,
        message: "Sélection non accessible",
      });
    }

    // Verify the image belongs to this selection
    const { data: _image, error: imageError } = await supabase
      .from("selection_images")
      .select("id, file_url")
      .eq("selection_id", selectionId)
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
        .from("selection-images")
        .createSignedUrl(decodedFilepath, 3600); // 1 hour expiry

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
