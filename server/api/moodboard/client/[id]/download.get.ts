import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const moodboardId = getRouterParam(event, "id");

  if (!moodboardId) {
    throw createError({
      statusCode: 400,
      message: "ID de moodboard requis",
    });
  }

  try {
    const supabase = await serverSupabaseClient(event);

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

    // TODO: Implement actual download functionality
    // This could generate a ZIP file with all moodboard images
    // Or provide download links for each image

    // For now, return a simple response
    return {
      success: true,
      message: "Téléchargement initié",
      moodboard: {
        id: moodboardId,
        title: moodboard.title,
        status: moodboard.status,
      },
      // TODO: Add actual download URL or file when implemented
      note: "La fonctionnalité de téléchargement sera implémentée prochainement",
    };
  } catch (error) {
    // Re-throw known errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unknown errors
    throw createError({
      statusCode: 500,
      message: "Erreur lors du téléchargement",
    });
  }
});
