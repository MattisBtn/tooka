import { serverSupabaseServiceRole } from "#supabase/server";
import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID is required",
    });
  }

  const { user_id } = body;
  const config = useRuntimeConfig();
  const supabase = await serverSupabaseServiceRole(event);
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

  try {
    // Récupérer le customer ID de l'utilisateur
    const { data: userProfile, error: userError } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user_id)
      .single();

    if (userError || !userProfile?.stripe_customer_id) {
      throw createError({
        statusCode: 404,
        statusMessage: "User or customer not found",
      });
    }

    // Créer le lien vers le portail client
    const session = await stripe.billingPortal.sessions.create({
      customer: userProfile.stripe_customer_id,
      return_url: `${config.public.baseUrl || "http://localhost:3000"}`,
    });

    return { url: session.url };
  } catch (error) {
    console.error("Portal session creation error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      throw createError({
        statusCode: 400,
        statusMessage: `Stripe error: ${error.message}`,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create portal session",
    });
  }
});
