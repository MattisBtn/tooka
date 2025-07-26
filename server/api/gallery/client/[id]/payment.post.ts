import { serverSupabaseClient } from "#supabase/server";

// Type pour les galeries avec info de projet et paiement
type GalleryWithProject = {
  id: string;
  payment_required: boolean;
  status: string;
  project: {
    id: string;
    title: string;
    remaining_amount: number | null;
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
  const galleryId = getRouterParam(event, "id");
  const { method } = await readBody(event); // 'bank_transfer' pour le MVP

  if (!galleryId) {
    throw createError({
      statusCode: 400,
      message: "ID de galerie requis",
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

    // Check if payment is required for this gallery
    if (!gallery.payment_required) {
      throw createError({
        statusCode: 400,
        message: "Aucun paiement requis pour cette galerie",
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

    // Validate payment method and bank details
    if (
      !gallery.project.payment_method ||
      gallery.project.payment_method !== "bank_transfer"
    ) {
      throw createError({
        statusCode: 400,
        message: "Méthode de paiement non supportée ou manquante",
      });
    }

    // Check if bank details are available
    if (
      !gallery.project.bank_iban?.trim() ||
      !gallery.project.bank_bic?.trim() ||
      !gallery.project.bank_beneficiary?.trim()
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
        iban: gallery.project.bank_iban,
        bic: gallery.project.bank_bic,
        beneficiary: gallery.project.bank_beneficiary,
        reference: paymentReference,
      },
    };

    // Get client info
    const client = gallery.project.client;
    const clientName =
      client.company_name ||
      `${client.first_name || ""} ${client.last_name || ""}`.trim();

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
