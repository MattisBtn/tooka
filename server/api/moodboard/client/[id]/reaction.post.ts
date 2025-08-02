import { serverSupabaseClient } from "#supabase/server";
import { z } from "zod";

const reactionSchema = z.object({
  imageId: z.string().uuid(),
  reaction: z.enum(["love", "like", "dislike"]),
  action: z.enum(["add", "remove"]).default("add"),
});

export default defineEventHandler(async (event) => {
  const moodboardId = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!moodboardId) {
    throw createError({
      statusCode: 400,
      message: "ID de moodboard requis",
    });
  }

  // Validate request body
  const validation = reactionSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: "Données invalides",
    });
  }

  const { imageId, reaction, action } = validation.data;

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

    // Check moodboard status - only allow reactions on active moodboards
    if (
      moodboard.status !== "awaiting_client" &&
      moodboard.status !== "revision_requested"
    ) {
      throw createError({
        statusCode: 403,
        message: "Réactions non autorisées sur ce moodboard",
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
        message: "Image non trouvée",
      });
    }

    if (action === "add") {
      // For anonymous reactions, we'll just add the reaction without session tracking
      // This means multiple reactions of the same type can be added by the same user
      const { error: insertError } = await supabase
        .from("moodboard_reactions")
        .insert({
          image_id: imageId,
          reaction_type: reaction,
        });

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw createError({
          statusCode: 500,
          message: `Erreur lors de la création de la réaction: ${insertError.message}`,
        });
      }

      return {
        success: true,
        action: "created",
        reaction,
      };
    } else {
      // Remove reaction - delete one instance of this reaction type
      const { error: deleteError } = await supabase
        .from("moodboard_reactions")
        .delete()
        .eq("image_id", imageId)
        .eq("reaction_type", reaction)
        .order("created_at", { ascending: false })
        .limit(1);

      if (deleteError) {
        console.error("Database delete error:", deleteError);
        throw createError({
          statusCode: 500,
          message: `Erreur lors de la suppression de la réaction: ${deleteError.message}`,
        });
      }

      return {
        success: true,
        action: "removed",
        reaction,
      };
    }
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
