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

    // Get proposal with project info directly
    const { data: proposal, error } = await supabase
      .from("proposals")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          password_hash,
          bank_iban,
          bank_bic,
          bank_beneficiary,
          bank_transfer_reference
        )
      `
      )
      .eq("id", proposalId)
      .single();

    if (error) {
      console.error("[DEBUG] Proposal API - Proposal query error:", error);
      if (error.code === "PGRST116") {
        throw createError({
          statusCode: 404,
          statusMessage: "Proposition non trouvée",
        });
      }
      throw new Error(`Failed to fetch proposal: ${error.message}`);
    }

    // Check if proposal is accessible to clients
    // Only allow access to proposals that are not in draft status

    // TODO: Uncomment this when we have a way to handle draft proposals
    // if (proposal.status === "draft") {
    //   throw createError({
    //     statusCode: 403,
    //     statusMessage: "Cette proposition n'est pas encore accessible",
    //   });
    // }

    // Type assertion pour le projet
    const projectData = proposal.project as {
      id: string;
      title: string;
      password_hash: string;
      bank_iban: string | null;
      bank_bic: string | null;
      bank_beneficiary: string | null;
      bank_transfer_reference: string | null;
    };

    // Prepare bank details if available
    const bankDetails =
      projectData.bank_iban &&
      projectData.bank_bic &&
      projectData.bank_beneficiary &&
      projectData.bank_transfer_reference
        ? {
            iban: projectData.bank_iban,
            bic: projectData.bank_bic,
            beneficiary: projectData.bank_beneficiary,
            reference: projectData.bank_transfer_reference,
          }
        : undefined;

    // Return data in the format expected by ClientProposalAccess
    return {
      project: {
        id: projectData.id,
        title: projectData.title,
        hasPassword: !!projectData.password_hash,
        bankDetails,
      },
      proposal: {
        id: proposal.id,
        content_html: proposal.content_html,
        content_json: proposal.content_json,
        price: proposal.price,
        deposit_required: proposal.deposit_required,
        deposit_amount: proposal.deposit_amount,
        status: proposal.status,
        contract_url: proposal.contract_url,
        quote_url: proposal.quote_url,
        project_id: proposal.project_id,
        revision_last_comment: proposal.revision_last_comment,
        created_at: proposal.created_at,
        updated_at: proposal.updated_at,
      },
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching client proposal:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la récupération de la proposition",
    });
  }
});
