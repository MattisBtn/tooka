import { serverSupabaseClient } from "#supabase/server";
import { clientCommentSchema } from "~/types/moodboard";

export default defineEventHandler(async (event) => {
  const moodboardId = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!moodboardId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de moodboard requis",
    });
  }

  // Validate request body
  const validation = clientCommentSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Données invalides",
    });
  }

  const { content, imageId } = body;

  if (!imageId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID d'image requis",
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
        statusMessage: "Moodboard non trouvé",
      });
    }

    // Check moodboard status - only allow comments on active moodboards
    if (
      moodboard.status !== "awaiting_client" &&
      moodboard.status !== "revision_requested"
    ) {
      throw createError({
        statusCode: 403,
        statusMessage: "Commentaires non autorisés sur ce moodboard",
      });
    }

    // Verify that the image belongs to the moodboard
    const { data: image, error: imageError } = await supabase
      .from("moodboard_images")
      .select("id, moodboard_id")
      .eq("id", imageId)
      .eq("moodboard_id", moodboardId)
      .single();

    if (imageError || !image) {
      throw createError({
        statusCode: 404,
        statusMessage: "Image non trouvée",
      });
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from("moodboard_comments")
      .insert({
        image_id: imageId,
        content: content.trim(),
      })
      .select()
      .single();

    if (commentError) {
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur lors de la création du commentaire",
      });
    }

    return { comment };
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
