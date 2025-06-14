import { serverSupabaseClient } from "#supabase/server";
import { clientImageSelectionSchema } from "~/types/selection";

export default defineEventHandler(async (event) => {
  const selectionId = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!selectionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de sélection requis",
    });
  }

  // Validate request body
  const validation = clientImageSelectionSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Données invalides",
    });
  }

  const { imageId, selected } = validation.data;

  try {
    const supabase = await serverSupabaseClient(event);

    // Verify selection exists and is accessible
    const { data: selection, error: selectionError } = await supabase
      .from("selections")
      .select("id, status")
      .eq("id", selectionId)
      .single();

    if (selectionError || !selection) {
      throw createError({
        statusCode: 404,
        statusMessage: "Sélection non trouvée",
      });
    }

    // Check selection status - only allow selections on active selections
    if (
      selection.status !== "awaiting_client" &&
      selection.status !== "revision_requested"
    ) {
      throw createError({
        statusCode: 403,
        statusMessage: "Sélections non autorisées sur cette sélection",
      });
    }

    // Verify that the image belongs to the selection
    const { data: image, error: imageError } = await supabase
      .from("selection_images")
      .select("id, selection_id, is_selected")
      .eq("id", imageId)
      .eq("selection_id", selectionId)
      .single();

    if (imageError || !image) {
      throw createError({
        statusCode: 404,
        statusMessage: "Image non trouvée",
      });
    }

    // Update the selection status of the image
    const { error: updateError } = await supabase
      .from("selection_images")
      .update({ is_selected: selected })
      .eq("id", imageId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw createError({
        statusCode: 500,
        statusMessage: `Erreur lors de la mise à jour de la sélection: ${updateError.message}`,
      });
    }

    return {
      success: true,
      action: selected ? "selected" : "deselected",
      imageId,
      selected,
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur serveur",
    });
  }
});
