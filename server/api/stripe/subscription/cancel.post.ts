import { serverSupabaseClient } from "#supabase/server";
import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.subscription_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Subscription ID is required",
    });
  }

  const { subscription_id } = body;
  const config = useRuntimeConfig();
  const supabase = await serverSupabaseClient(event);
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

  try {
    // Annuler l'abonnement dans Stripe
    await stripe.subscriptions.cancel(subscription_id);

    // Mettre à jour la base de données
    await supabase
      .from("user_profiles")
      .update({
        subscription_status: "canceled",
      })
      .eq("stripe_subscription_id", subscription_id);

    return { success: true };
  } catch (error) {
    console.error("Subscription cancellation error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      throw createError({
        statusCode: 400,
        statusMessage: `Stripe error: ${error.message}`,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to cancel subscription",
    });
  }
});
