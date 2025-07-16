import { serverSupabaseClient } from "#supabase/server";

interface RequestRevisionsBody {
  comment?: string;
}

export default defineEventHandler(async (event) => {
  const proposalId = getRouterParam(event, "id");
  const body = await readBody<RequestRevisionsBody>(event);

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

    // Check if proposal can have revisions requested
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

    // Update proposal status to revision_requested and store the client comment
    const { data: updatedProposal, error: updateError } = await supabase
      .from("proposals")
      .update({
        status: "revision_requested",
        revision_last_comment: body?.comment || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId)
      .select()
      .single();

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur lors de la demande de révisions",
      });
    }

    // TODO: Send notification to photographer about revision request

    return {
      success: true,
      proposal: updatedProposal,
      message: "Demande de révision envoyée avec succès",
      comment: body?.comment || null,
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error requesting proposal revisions:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la demande de révisions",
    });
  }
});
