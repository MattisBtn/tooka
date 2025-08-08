import { serverSupabaseServiceRole } from "#supabase/server";

interface VerifyRequestBody {
  password: string;
}

export default defineEventHandler(async (event) => {
  const proposalId = getRouterParam(event, "id");
  const body = await readBody<VerifyRequestBody>(event);

  if (!proposalId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de proposition requis",
    });
  }

  if (!body?.password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Mot de passe requis",
    });
  }

  try {
    const supabase = await serverSupabaseServiceRole(event);

    // Get proposal with project info directly
    const { data: proposal, error } = await supabase
      .from("proposals")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          password_hash
        )
      `
      )
      .eq("id", proposalId)
      .single();

    if (error) {
      console.error("[DEBUG] Verify API - Proposal query error:", error);
      if (error.code === "PGRST116") {
        throw createError({
          statusCode: 404,
          statusMessage: "Proposition non trouvée",
        });
      }
      throw new Error(`Failed to fetch proposal: ${error.message}`);
    }

    // Check if proposal is accessible
    if (proposal.status === "draft") {
      throw createError({
        statusCode: 403,
        statusMessage: "Cette proposition n'est pas encore accessible",
      });
    }

    // Type assertion pour le projet
    const projectData = proposal.project as {
      id: string;
      title: string;
      password_hash: string;
    };

    // If no password hash exists, consider it valid (no password required)
    if (!projectData.password_hash) {
      return { valid: true };
    }

    // Simple password comparison (consistent with other client endpoints)
    const isValid = body.password === projectData.password_hash;

    return { valid: isValid };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error verifying proposal password:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la vérification du mot de passe",
    });
  }
});
