import { serverSupabaseClient } from "#supabase/server";
import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, "id");

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID is required",
    });
  }

  const supabase = await serverSupabaseClient(event);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    // Récupérer le profil utilisateur avec les infos Stripe
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select(
        "stripe_account_id, stripe_account_status, stripe_details_submitted, stripe_charges_enabled, stripe_payouts_enabled, stripe_connected_at"
      )
      .eq("id", userId)
      .single();

    if (profileError) {
      if (profileError.code === "PGRST116") {
        return { account: null };
      }
      throw new Error(`Database error: ${profileError.message}`);
    }

    if (!profile?.stripe_account_id) {
      return { account: null };
    }

    // Récupérer les détails du compte depuis Stripe pour s'assurer qu'ils sont à jour
    let account;
    try {
      account = await stripe.accounts.retrieve(profile.stripe_account_id);
    } catch (stripeError: unknown) {
      // Si le compte n'existe plus ou l'accès a été révoqué, nettoyer les données
      const error = stripeError as { code?: string; message?: string };
      if (
        error.code === "account_invalid" ||
        error.message?.includes("does not have access to account") ||
        error.message?.includes("Application access may have been revoked")
      ) {
        // Nettoyer les données Stripe dans la DB
        await supabase
          .from("user_profiles")
          .update({
            stripe_account_id: null,
            stripe_account_status: null,
            stripe_details_submitted: null,
            stripe_charges_enabled: null,
            stripe_payouts_enabled: null,
            stripe_connected_at: null,
          })
          .eq("id", userId);

        return { account: null };
      }
      // Pour les autres erreurs Stripe, les relancer
      throw stripeError;
    }

    // Mettre à jour les informations dans la base si nécessaire
    const currentStatus =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled
        ? "complete"
        : account.details_submitted
        ? "pending"
        : "pending";

    if (
      currentStatus !== profile.stripe_account_status ||
      account.details_submitted !== profile.stripe_details_submitted ||
      account.charges_enabled !== profile.stripe_charges_enabled ||
      account.payouts_enabled !== profile.stripe_payouts_enabled
    ) {
      await supabase
        .from("user_profiles")
        .update({
          stripe_account_status: currentStatus,
          stripe_details_submitted: account.details_submitted,
          stripe_charges_enabled: account.charges_enabled,
          stripe_payouts_enabled: account.payouts_enabled,
        })
        .eq("id", userId);
    }

    return {
      account: {
        account_id: account.id,
        status: currentStatus,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        connected_at: profile.stripe_connected_at,
      },
    };
  } catch (error) {
    console.error("Stripe account fetch error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch Stripe account",
    });
  }
});
