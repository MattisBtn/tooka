import { serverSupabaseServiceRole } from "#supabase/server";
import Stripe from "stripe";

// Type pour les propositions avec info de projet et paiement
type ProposalWithProject = {
  id: string;
  deposit_required: boolean;
  deposit_amount: number | null;
  price: number;
  project: {
    id: string;
    title: string;
    user_id: string;
    initial_price: number | null;
    remaining_amount: number | null;
    payment_status: string | null;
    payment_method: "stripe" | "bank_transfer" | null;
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
  const { method } = await readBody(event);

  if (!proposalId) {
    throw createError({
      statusCode: 400,
      message: "ID de proposition requis",
    });
  }

  if (!method || (method !== "stripe" && method !== "bank_transfer")) {
    throw createError({
      statusCode: 400,
      message: "Méthode de paiement non supportée",
    });
  }

  try {
    const supabase = await serverSupabaseServiceRole(event);
    const config = useRuntimeConfig();
    const stripe = new Stripe(config.STRIPE_SECRET_KEY);

    // Get proposal with project info including payment details
    const { data: proposalData, error: proposalError } = await supabase
      .from("proposals")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          user_id,
          initial_price,
          remaining_amount,
          payment_method,
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
        message: proposalError.message,
      });
    }

    const proposal = proposalData as ProposalWithProject;

    // Check if deposit is required
    if (!proposal.deposit_required || !proposal.deposit_amount) {
      throw createError({
        statusCode: 400,
        message: "Aucun acompte requis pour cette proposition",
      });
    }

    // Validate payment method matches project configuration
    if (
      !proposal.project.payment_method ||
      proposal.project.payment_method !== method
    ) {
      throw createError({
        statusCode: 400,
        message: "Méthode de paiement non autorisée pour ce projet",
      });
    }

    // Get client info
    const client = proposal.project.client;
    const clientName =
      client.company_name ||
      `${client.first_name || ""} ${client.last_name || ""}`.trim();

    // Handle different payment methods
    if (method === "bank_transfer") {
      // Get user profile data for bank details
      const { data: userProfile, error: userProfileError } = await supabase
        .from("user_profiles")
        .select("bank_account_holder, bank_bic, bank_iban, bank_name")
        .eq("id", proposal.project.user_id)
        .single();

      if (userProfileError || !userProfile) {
        throw createError({
          statusCode: 400,
          message: "Profil utilisateur non trouvé",
        });
      }

      // Check if bank details are available from user profile
      if (
        !userProfile.bank_iban?.trim() ||
        !userProfile.bank_bic?.trim() ||
        !userProfile.bank_account_holder?.trim()
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

      // Prepare payment details with bank coordinates from user profile
      const paymentDetails = {
        amount: proposal.deposit_amount,
        reference: paymentReference,
        bankDetails: {
          iban: userProfile.bank_iban,
          bic: userProfile.bank_bic,
          beneficiary: userProfile.bank_account_holder,
          reference: paymentReference,
        },
      };

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
    } else if (method === "stripe") {
      // Get photographer's Stripe account
      const { data: userProfile, error: userProfileError } = await supabase
        .from("user_profiles")
        .select("stripe_account_id, stripe_account_status")
        .eq("id", proposal.project.user_id)
        .single();

      if (userProfileError || !userProfile) {
        throw createError({
          statusCode: 400,
          message: "Profil photographe non trouvé",
        });
      }

      if (!userProfile.stripe_account_id) {
        throw createError({
          statusCode: 400,
          message: "Compte Stripe du photographe non configuré",
        });
      }

      if (userProfile.stripe_account_status !== "complete") {
        throw createError({
          statusCode: 400,
          message: "Compte Stripe du photographe non activé",
        });
      }

      // Generate payment reference
      const paymentReference = `PROP-${proposalId
        .slice(0, 8)
        .toUpperCase()}-${Date.now()}`;

      // Create Checkout Session with destination charge
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `Acompte - ${proposal.project.title}`,
                description: `Acompte pour la proposition ${proposalId}`,
              },
              unit_amount: Math.round(proposal.deposit_amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${
          config.public.baseUrl || "http://localhost:3000"
        }/proposal/${proposalId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${
          config.public.baseUrl || "http://localhost:3000"
        }/proposal/${proposalId}?canceled=true`,
        metadata: {
          proposal_id: proposalId,
          project_id: proposal.project.id,
          payment_reference: paymentReference,
          client_name: clientName,
        },
        // Destination charge - funds go directly to photographer's account
        payment_intent_data: {
          transfer_data: {
            destination: userProfile.stripe_account_id,
          },
          metadata: {
            proposal_id: proposalId,
            project_id: proposal.project.id,
            payment_reference: paymentReference,
            client_name: clientName,
          },
        },
      });

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

      // Return Stripe checkout URL
      return {
        success: true,
        message: "Session de paiement créée",
        payment: {
          method: "stripe",
          amount: proposal.deposit_amount,
          reference: paymentReference,
          checkoutUrl: session.url,
        },
        proposal: {
          id: updatedProposal.id,
          status: updatedProposal.status,
          clientName,
          projectTitle: proposal.project.title,
        },
      };
    }

    throw createError({
      statusCode: 400,
      message: "Méthode de paiement non supportée",
    });
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
