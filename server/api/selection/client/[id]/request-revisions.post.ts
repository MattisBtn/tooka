import { serverSupabaseClient } from "#supabase/server";
import type { ClientRevisionRequest } from "~/types/selection";

export default defineEventHandler(async (event) => {
  const selectionId = getRouterParam(event, "id");
  const body = await readBody<ClientRevisionRequest>(event);

  if (!selectionId) {
    throw createError({
      statusCode: 400,
      message: "ID de sélection requis",
    });
  }

  try {
    const supabase = await serverSupabaseClient(event);

    // Get selection with project info
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

    // Check if selection can have revisions requested
    if (selection.status !== "awaiting_client") {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Des révisions ne peuvent pas être demandées pour cette sélection dans son état actuel",
      });
    }

    // Update selection status to revision_requested
    const { error: updateError } = await supabase
      .from("selections")
      .update({
        status: "revision_requested",
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectionId);

    if (updateError) {
      throw new Error(`Failed to update selection: ${updateError.message}`);
    }

    // TODO: If there's a comment, we could store it in a comments table
    // For now, we'll just return success with the comment included
    // TODO: Implement selection_comments table and store the revision comment

    // TODO: Optionally send notification to photographer with the comment
    // This could be implemented later with email notifications

    return {
      success: true,
      message: "Demande de révision envoyée avec succès",
      selection: {
        id: selectionId,
        status: "revision_requested",
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
