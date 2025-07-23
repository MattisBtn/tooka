import { serverSupabaseClient } from "#supabase/server";

// Type pour les propositions avec info de projet et paiement
type ProposalWithProject = {
  id: string;
  deposit_required: boolean;
  deposit_amount: number | null;
  price: number;
  project: {
    id: string;
    title: string;
    initial_price: number | null;
    remaining_amount: number | null;
    payment_status: string | null;
    payment_method: "stripe" | "bank_transfer" | null;
    bank_iban: string | null;
    bank_bic: string | null;
    bank_beneficiary: string | null;
    client: {
      id: string;
      billing_email: string;
      first_name: string | null;
      last_name: string | null;
      company_name: string | null;
    };
  };
};

export default defineEventHandler(async (event) => {
  const proposalId = getRouterParam(event, "id");
  const { method } = await readBody(event); // 'bank_transfer' pour le MVP

  if (!proposalId) {
    throw createError({
      statusCode: 400,
      message: "ID de proposition requis",
    });
  }

  if (method !== "bank_transfer") {
    throw createError({
      statusCode: 400,
      message: "Méthode de paiement non supportée pour le moment",
    });
  }

  try {
    const supabase = await serverSupabaseClient(event);

    // Get proposal with project info including payment details
    const { data: proposalData, error: proposalError } = await supabase
      .from("proposals")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          initial_price,
          remaining_amount,
          payment_status,
          payment_method,
          bank_iban,
          bank_bic,
          bank_beneficiary,
          client:clients(
            id,
            billing_email,
            first_name,
            last_name,
            company_name
          )
        )
      `
      )
      .eq("id", proposalId)
      .single();

    if (proposalError || !proposalData) {
      throw createError({
        statusCode: 404,
        message: "Proposition non trouvée",
      });
    }

    const proposal = proposalData as ProposalWithProject;

    // Check if deposit is required and payment method is bank_transfer
    if (!proposal.deposit_required || !proposal.deposit_amount) {
      throw createError({
        statusCode: 400,
        message: "Aucun acompte requis pour cette proposition",
      });
    }

    // Validate payment method and bank details (now from project)
    if (
      !proposal.project.payment_method ||
      proposal.project.payment_method !== "bank_transfer"
    ) {
      throw createError({
        statusCode: 400,
        message: "Méthode de paiement non supportée ou manquante",
      });
    }

    // Check if bank details are available (now from project)
    if (
      !proposal.project.bank_iban?.trim() ||
      !proposal.project.bank_bic?.trim() ||
      !proposal.project.bank_beneficiary?.trim()
    ) {
      throw createError({
        statusCode: 400,
        message: "Coordonnées bancaires manquantes",
      });
    }

    // Generate payment reference
    const paymentReference = `PROP-${proposalId
      .slice(0, 8)
      .toUpperCase()}-${Date.now()}`;

    // Prepare payment details with bank coordinates from project
    const paymentDetails = {
      amount: proposal.deposit_amount,
      reference: paymentReference,
      bankDetails: {
        iban: proposal.project.bank_iban,
        bic: proposal.project.bank_bic,
        beneficiary: proposal.project.bank_beneficiary,
        reference: paymentReference,
      },
    };

    // Get client info
    const client = proposal.project.client;
    const clientName =
      client.company_name ||
      `${client.first_name || ""} ${client.last_name || ""}`.trim();

    // Update proposal status to payment_pending
    const { data: updatedProposal, error: updateError } = await supabase
      .from("proposals")
      .update({
        status: "payment_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId)
      .select()
      .single();

    if (updateError) {
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la mise à jour du statut",
      });
    }

    // Return payment details for client display
    return {
      success: true,
      message: "Instructions de paiement générées",
      payment: paymentDetails,
      proposal: {
        id: updatedProposal.id,
        status: updatedProposal.status,
        clientName,
        projectTitle: proposal.project.title,
      },
    };
  } catch (error: unknown) {
    console.error("Payment initiation error:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Erreur interne du serveur",
    });
  }
});
