import { serverSupabaseServiceRole } from "#supabase/server";
import type { ClientPasswordVerification } from "~/types/moodboard";

export default defineEventHandler(async (event) => {
  const moodboardId = getRouterParam(event, "id");
  const body = await readBody<ClientPasswordVerification>(event);

  if (!moodboardId) {
    throw createError({
      statusCode: 400,
      message: "ID de moodboard requis",
    });
  }

  try {
    const supabase = await serverSupabaseServiceRole(event);

    // Get moodboard with project info directly
    const { data: moodboard, error } = await supabase
      .from("moodboards")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          description,
          password_hash,
          status
        )
      `
      )
      .eq("id", moodboardId)
      .single();

    if (error) {
      console.error("[DEBUG] Verify API - Moodboard query error:", error);
      if (error.code === "PGRST116") {
        throw createError({
          statusCode: 404,
          message: "Moodboard non trouvé",
        });
      }
      throw new Error(`Failed to fetch moodboard: ${error.message}`);
    }

    // Check if moodboard is accessible to clients
    if (
      moodboard.status !== "awaiting_client" &&
      moodboard.status !== "completed" &&
      moodboard.status !== "revision_requested"
    ) {
      console.error(
        "[DEBUG] Verify API - Moodboard not accessible, status:",
        moodboard.status
      );
      throw createError({
        statusCode: 403,
        message: "Moodboard non accessible",
      });
    }

    // Type assertion pour le projet
    const projectData = moodboard.project as {
      id: string;
      title: string;
      description: string | null;
      password_hash: string;
      status: string;
    };

    // If no password hash exists, consider it valid (no password required)
    if (!projectData.password_hash) {
      return { valid: true };
    }

    // If password hash exists, password is required
    if (!body?.password) {
      throw createError({
        statusCode: 400,
        message: "Mot de passe requis",
      });
    }

    const valid = body.password === projectData.password_hash;

    return { valid };
  } catch (error) {
    // Re-throw known errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unknown errors
    throw createError({
      statusCode: 500,
      message: "Erreur de vérification",
    });
  }
});
