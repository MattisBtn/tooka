import { serverSupabaseServiceRole } from "#supabase/server";
import type { ClientRevisionRequest } from "~/types/moodboard";

export default defineEventHandler(async (event) => {
  const moodboardId = getRouterParam(event, "id");
  const body = await readBody<ClientRevisionRequest>(event);

  if (!moodboardId) {
    throw createError({
      statusCode: 400,
      message: "ID de moodboard requis",
    });
  }

  try {
    const supabase = await serverSupabaseServiceRole(event);

    // Get moodboard with project info
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

    // Check if moodboard can have revisions requested
    if (moodboard.status !== "awaiting_client") {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Des révisions ne peuvent pas être demandées pour ce moodboard dans son état actuel",
      });
    }

    // Update moodboard status to revision_requested
    const { error: updateError } = await supabase
      .from("moodboards")
      .update({
        status: "revision_requested",
        revision_last_comment: body.comment || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moodboardId);

    if (updateError) {
      throw new Error(`Failed to update moodboard: ${updateError.message}`);
    }

    return {
      success: true,
      message: "Demande de révision envoyée avec succès",
      moodboard: {
        id: moodboardId,
        status: "revision_requested",
        revision_last_comment: body.comment || null,
      },
      comment: body.comment || null,
    };
  } catch (error) {
    // Re-throw known errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unknown errors
    throw createError({
      statusCode: 500,
      message: "Erreur lors de la demande de révision",
    });
  }
});
