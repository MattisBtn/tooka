import { serverSupabaseClient } from "#supabase/server";
import type { ClientRevisionRequest } from "~/types/gallery";

export default defineEventHandler(async (event) => {
  const galleryId = getRouterParam(event, "id");
  const body = await readBody<ClientRevisionRequest>(event);

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
          "Cette galerie ne peut pas faire l'objet de demande de retouches dans son état actuel",
      });
    }

    // Update gallery status to revision_requested
    const { data: updatedGallery, error: updateError } = await supabase
      .from("galleries")
      .update({
        status: "revision_requested",
        updated_at: new Date().toISOString(),
      })
      .eq("id", galleryId)
      .select()
      .single();

    if (updateError) {
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la demande de retouches",
      });
    }

    // TODO: Store client comment in database
    // Note: The current database schema doesn't have a field for client comments on galleries
    // We might need to add a new table like "gallery_client_comments" or add a field to galleries table
    const clientComment = body?.comment;

    // For now, we'll just log the comment
    if (clientComment) {
      console.log(`Client comment for gallery ${galleryId}:`, clientComment);
    }

    // TODO: Send notification to photographer about revision request

    return {
      success: true,
      gallery: updatedGallery,
      message: "Demande de retouches envoyée avec succès",
      comment: clientComment,
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
