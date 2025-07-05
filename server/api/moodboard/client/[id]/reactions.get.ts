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
      .select("id, status")
      .eq("id", moodboardId)
      .single();

    if (moodboardError || !moodboard) {
      throw createError({
        statusCode: 404,
        message: "Moodboard non trouvé",
      });
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

    // Get reaction counts for all images in the moodboard
    const { data: reactions, error: reactionsError } = await supabase
      .from("moodboard_reactions")
      .select(
        `
        image_id,
        reaction_type,
        moodboard_images!inner(moodboard_id)
      `
      )
      .eq("moodboard_images.moodboard_id", moodboardId);

    if (reactionsError) {
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la récupération des réactions",
      });
    }

    // Group reactions by image and type
    const reactionCounts: Record<
      string,
      { love: number; like: number; dislike: number }
    > = {};

    reactions?.forEach((reaction) => {
      if (!reactionCounts[reaction.image_id]) {
        reactionCounts[reaction.image_id] = {
          love: 0,
          like: 0,
          dislike: 0,
        };
      }
      reactionCounts[reaction.image_id][reaction.reaction_type]++;
    });

    return {
      success: true,
      reactions: reactionCounts,
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Erreur serveur",
    });
  }
});
