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

    // Check if gallery is in awaiting_client status
    if (gallery.status !== "awaiting_client") {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Cette galerie ne peut pas être validée dans son état actuel",
      });
    }

    // Check if payment is required (should not be for this endpoint)
    if (gallery.payment_required) {
      throw createError({
        statusCode: 400,
        statusMessage: "Cette galerie nécessite un paiement pour être validée",
      });
    }

    // Update gallery status to completed
    const { data: updatedGallery, error: updateError } = await supabase
      .from("galleries")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", galleryId)
      .select()
      .single();

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur lors de la validation de la galerie",
      });
    }

    return {
      success: true,
      gallery: updatedGallery,
      message: "Galerie validée avec succès",
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
