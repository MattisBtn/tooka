import { serverSupabaseClient } from "#supabase/server";
import { z } from "zod";

const validateSchema = z.object({
  selectedImages: z.array(z.string().uuid()),
});

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
  const validation = validateSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Données invalides",
    });
  }

  const { selectedImages } = validation.data;

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
          statusMessage: "Sélection non trouvée",
        });
      }
      throw new Error(`Failed to fetch selection: ${selectionError.message}`);
    }

    // Check if selection can be validated
    if (selection.status !== "awaiting_client") {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Cette sélection ne peut pas être validée dans son état actuel",
      });
    }

    // Update the is_selected status for all images in this selection
    const { error: updateError } = await supabase
      .from("selection_images")
      .update({ is_selected: false })
      .eq("selection_id", selectionId);

    if (updateError) {
      throw new Error(`Failed to reset selections: ${updateError.message}`);
    }

    // Set selected images to true if any were selected
    if (selectedImages.length > 0) {
      const { error: selectError } = await supabase
        .from("selection_images")
        .update({ is_selected: true })
        .eq("selection_id", selectionId)
        .in("id", selectedImages);

      if (selectError) {
        throw new Error(`Failed to update selections: ${selectError.message}`);
      }
    }

    // Update selection status to completed
    const { error: statusUpdateError } = await supabase
      .from("selections")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectionId);

    if (statusUpdateError) {
      throw new Error(
        `Failed to update selection: ${statusUpdateError.message}`
      );
    }

    return {
      success: true,
      message: "Sélection validée avec succès",
      selection: {
        id: selectionId,
        status: "completed",
        selectedCount: selectedImages.length,
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
      statusMessage: "Erreur lors de la validation",
    });
  }
});
