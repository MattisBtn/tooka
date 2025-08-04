import { serverSupabaseClient } from "#supabase/server";
import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.price_id || !body.user_id || !body.plan_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Price ID, User ID and Plan ID are required",
    });
  }

  const { price_id, user_id, plan_id, interval = "monthly" } = body;
  const config = useRuntimeConfig();
  const supabase = await serverSupabaseClient(event);
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

  try {
    // Récupérer les infos utilisateur
    const { data: userProfile, error: userError } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id, first_name, last_name")
      .eq("id", user_id)
      .single();

    if (userError) {
      throw createError({
        statusCode: 404,
        statusMessage: "User not found",
      });
    }

    let customerId = userProfile?.stripe_customer_id;

    // Créer le customer Stripe s'il n'existe pas
    if (!customerId) {
      const { data: authUser } = await supabase.auth.getUser();
      const customer = await stripe.customers.create({
        email: authUser.user?.email,
        name: `${userProfile?.first_name} ${userProfile?.last_name}`,
        metadata: { user_id },
      });
      customerId = customer.id;

      // Sauvegarder le customer ID
      await supabase
        .from("user_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user_id);
    }

    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: price_id, quantity: 1 }],
      mode: "subscription",
      success_url: `${
        config.public.baseUrl || "http://localhost:3000"
      }/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.public.baseUrl || "http://localhost:3000"}/pricing`,
      metadata: { user_id, interval, plan_id },
    });

    return { url: session.url };
  } catch (error) {
    console.error("Stripe checkout creation error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      throw createError({
        statusCode: 400,
        statusMessage: `Stripe error: ${error.message}`,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create checkout session",
    });
  }
});
