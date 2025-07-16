import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const proposalId = getRouterParam(event, "id");

  if (!proposalId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de proposition requis",
    });
  }

  try {
    const supabase = await serverSupabaseClient(event);

    // Get proposal with project info
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          status
        )
      `
      )
      .eq("id", proposalId)
      .single();

    if (proposalError || !proposal) {
      throw createError({
        statusCode: 404,
        statusMessage: "Proposition non trouvée",
      });
    }

    // Check if proposal can be validated
    if (proposal.status === "draft") {
      throw createError({
        statusCode: 403,
        statusMessage: "Cette proposition n'est pas encore accessible",
      });
    }

    if (proposal.status === "completed") {
      throw createError({
        statusCode: 400,
        statusMessage: "Cette proposition a déjà été acceptée",
      });
    }

    // Update proposal status to completed
    const { data: updatedProposal, error: updateError } = await supabase
      .from("proposals")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId)
      .select()
      .single();

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur lors de la validation de la proposition",
      });
    }

    return {
      success: true,
      proposal: updatedProposal,
      message: "Proposition acceptée avec succès",
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error validating proposal:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la validation de la proposition",
    });
  }
});
