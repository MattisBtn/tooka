import { serverSupabaseClient } from "#supabase/server";

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

    // Check if gallery is in awaiting_client status
    if (gallery.status !== "awaiting_client") {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Cette galerie ne peut pas être validée dans son état actuel",
      });
    }

    // Check if payment is required
    if (!gallery.payment_required) {
      throw createError({
        statusCode: 400,
        message: "Cette galerie ne nécessite pas de paiement",
      });
    }

    // TODO: Implement payment processing here
    // For now, we'll just update the status assuming payment is successful

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
        message: "Erreur lors de la validation de la galerie",
      });
    }

    return {
      success: true,
      gallery: updatedGallery,
      message: "Galerie validée et paiement traité avec succès",
      payment_processed: true, // TODO: Replace with actual payment status
    };
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
