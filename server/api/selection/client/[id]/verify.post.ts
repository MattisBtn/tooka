import { serverSupabaseClient } from "#supabase/server";
import type { ClientPasswordVerification } from "~/types/selection";

export default defineEventHandler(async (event) => {
  const selectionId = getRouterParam(event, "id");
  const body = await readBody<ClientPasswordVerification>(event);

  if (!selectionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de sélection requis",
    });
  }

  if (!body?.password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Mot de passe requis",
    });
  }

  try {
    const supabase = await serverSupabaseClient(event);

    // Get selection with project info
    const { data: selection, error } = await supabase
      .from("selections")
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
      .eq("id", selectionId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw createError({
          statusCode: 404,
          statusMessage: "Sélection non trouvée",
        });
      }
      throw new Error(`Failed to fetch selection: ${error.message}`);
    }

    // Check if selection is accessible to clients
    if (
      selection.status !== "awaiting_client" &&
      selection.status !== "completed" &&
      selection.status !== "revision_requested"
    ) {
      throw createError({
        statusCode: 403,
        statusMessage: "Sélection non accessible",
      });
    }

    const projectData = selection.project as {
      id: string;
      title: string;
      description: string | null;
      password_hash: string;
      status: string;
    };

    // If no password hash exists, consider it valid
    if (!projectData.password_hash) {
      return { valid: true };
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
      statusMessage: "Erreur de vérification",
    });
  }
});
