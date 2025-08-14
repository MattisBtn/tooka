import { serverSupabaseServiceRole } from "#supabase/server";
import Stripe from "stripe";

// Type pour les galeries avec info de projet et paiement
type GalleryWithProject = {
  id: string;
  status: string;
  project: {
    id: string;
    title: string;
    remaining_amount: number | null;
    payment_method: "stripe" | "bank_transfer" | null;
    user_id: string;
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
  const galleryId = getRouterParam(event, "id");
  const { method } = await readBody(event);

  if (!galleryId) {
    throw createError({
      statusCode: 400,
      message: "ID de galerie requis",
    });
  }

  if (!method || (method !== "bank_transfer" && method !== "stripe")) {
    throw createError({
      statusCode: 400,
      message: "Méthode de paiement non supportée",
    });
  }

  try {
    const supabase = await serverSupabaseServiceRole(event);
    const config = useRuntimeConfig();

    // Get gallery with project info including payment details
    const { data: galleryData, error: galleryError } = await supabase
      .from("galleries")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          remaining_amount,
          payment_method,
          user_id,
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
      .eq("id", galleryId)
      .single();

    if (galleryError || !galleryData) {
      throw createError({
        statusCode: 404,
        message: "Galerie non trouvée",
      });
    }

    const gallery = galleryData as GalleryWithProject;

    // Check if gallery is awaiting client action
    if (gallery.status !== "awaiting_client") {
      throw createError({
        statusCode: 400,
        message: "Cette galerie n'est pas en attente de validation client",
      });
    }

    // Check if there's a remaining amount to pay
    if (
      !gallery.project.remaining_amount ||
      gallery.project.remaining_amount <= 0
    ) {
      throw createError({
        statusCode: 400,
        message: "Aucun montant restant à payer pour ce projet",
      });
    }

    // Validate payment method
    if (
      !gallery.project.payment_method ||
      gallery.project.payment_method !== method
    ) {
      throw createError({
        statusCode: 400,
        message: "Méthode de paiement non supportée ou manquante",
      });
    }

    // Get client info
    const client = gallery.project.client;
    const clientName =
      client.company_name ||
      `${client.first_name || ""} ${client.last_name || ""}`.trim();

    if (method === "bank_transfer") {
      // Get photographer's bank details from user_profiles
      const { data: userProfile, error: userProfileError } = await supabase
        .from("user_profiles")
        .select("bank_account_holder, bank_bic, bank_iban, bank_name")
        .eq("id", gallery.project.user_id)
        .single();

      if (userProfileError || !userProfile) {
        throw createError({
          statusCode: 400,
          message: "Profil photographe non trouvé",
        });
      }

      // Check if bank details are available
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
      const paymentReference = `GAL-${galleryId
        .slice(0, 8)
        .toUpperCase()}-${Date.now()}`;

      // Prepare payment details with bank coordinates
      const paymentDetails = {
        amount: gallery.project.remaining_amount,
        reference: paymentReference,
        bankDetails: {
          iban: userProfile.bank_iban,
          bic: userProfile.bank_bic,
          beneficiary: userProfile.bank_account_holder,
          reference: paymentReference,
        },
      };

      // Update gallery status to payment_pending
      const { data: updatedGallery, error: updateError } = await supabase
        .from("galleries")
        .update({
          status: "payment_pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", galleryId)
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
        gallery: {
          id: updatedGallery.id,
          status: updatedGallery.status,
          clientName,
          projectTitle: gallery.project.title,
        },
      };
    } else if (method === "stripe") {
      // Get photographer's Stripe account
      const { data: userProfile, error: userProfileError } = await supabase
        .from("user_profiles")
        .select("stripe_account_id, stripe_account_status")
        .eq("id", gallery.project.user_id)
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

      // Initialize Stripe
      const stripe = new Stripe(config.STRIPE_SECRET_KEY);

      // Generate payment reference
      const paymentReference = `GAL-${galleryId
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
                name: `Solde restant - ${gallery.project.title}`,
                description: `Paiement du solde restant pour la galerie ${galleryId}`,
              },
              unit_amount: Math.round(gallery.project.remaining_amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${
          config.public.baseUrl || "http://localhost:3000"
        }/gallery/${galleryId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${
          config.public.baseUrl || "http://localhost:3000"
        }/gallery/${galleryId}?canceled=true`,
        metadata: {
          gallery_id: galleryId,
          project_id: gallery.project.id,
          payment_reference: paymentReference,
          client_name: clientName,
        },
        payment_intent_data: {
          transfer_data: {
            destination: userProfile.stripe_account_id,
          },
          metadata: {
            gallery_id: galleryId,
            project_id: gallery.project.id,
            payment_reference: paymentReference,
            client_name: clientName,
          },
        },
      });

      // Update gallery status to payment_pending
      const { data: updatedGallery, error: updateError } = await supabase
        .from("galleries")
        .update({
          status: "payment_pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", galleryId)
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
          amount: gallery.project.remaining_amount,
          reference: paymentReference,
          checkoutUrl: session.url,
        },
        gallery: {
          id: updatedGallery.id,
          status: updatedGallery.status,
          clientName,
          projectTitle: gallery.project.title,
        },
      };
    }
  } catch (error: unknown) {
    console.error("Gallery payment initiation error:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Erreur interne du serveur",
    });
  }
});
