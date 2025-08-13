import { serverSupabaseServiceRole } from "#supabase/server";
import { MODULE_STATUS } from "~/types/status";

export default defineEventHandler(async (event) => {
  const moodboardId = getRouterParam(event, "id");

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

    // Check if moodboard can be validated
    if (moodboard.status !== MODULE_STATUS.AWAITING_CLIENT) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Ce moodboard ne peut pas être validé dans son état actuel",
      });
    }

    // Update moodboard status to completed
    const { error: updateError } = await supabase
      .from("moodboards")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", moodboardId);

    if (updateError) {
      throw new Error(`Failed to update moodboard: ${updateError.message}`);
    }

    // TODO: Optionally send notification to photographer
    // This could be implemented later with email notifications

    return {
      success: true,
      message: "Moodboard validé avec succès",
      moodboard: {
        id: moodboardId,
        status: "completed",
      },
    };
  } catch (error) {
    // Re-throw known errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unknown errors
    throw createError({
      statusCode: 500,
      message: "Erreur lors de la validation",
    });
  }
});
