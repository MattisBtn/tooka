import { serverSupabaseServiceRole } from "#supabase/server";
import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event);
  const signature = getHeader(event, "stripe-signature");

  if (!body || !signature) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing body or signature",
    });
  }

  const config = useRuntimeConfig();
  const supabase = await serverSupabaseServiceRole(event);
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

  try {
    const webhook = stripe.webhooks.constructEvent(
      body,
      signature,
      config.STRIPE_WEBHOOK_SECRET
    );

    // Traiter les événements de manière simplifiée
    if (webhook.type === "checkout.session.completed") {
      const session = webhook.data.object as Stripe.Checkout.Session;
      const { user_id } = session.metadata || {};

      if (user_id && session.subscription) {
        console.log(
          "Updating user subscription:",
          user_id,
          session.subscription
        );

        // Récupérer les détails de la subscription pour obtenir la date de fin
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const { error } = await supabase
          .from("user_profiles")
          .update({
            subscription_status: "active",
            stripe_subscription_id: session.subscription as string,
            subscription_end_date: new Date(
              (subscription as unknown as { current_period_end: number })
                .current_period_end * 1000
            ).toISOString(),
          })
          .eq("id", user_id);

        if (error) {
          console.error("Supabase update error:", error);
          throw new Error(
            `Failed to update user subscription: ${error.message}`
          );
        }

        console.log("User subscription updated successfully");
      } else {
        console.error("No user_id or subscription found in session metadata");
      }
    }

    if (webhook.type === "customer.subscription.updated") {
      const subscription = webhook.data.object as Stripe.Subscription;

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("stripe_customer_id", subscription.customer as string)
        .single();

      if (userProfile) {
        await supabase
          .from("user_profiles")
          .update({
            subscription_status: subscription.status,
            subscription_end_date: new Date(
              (subscription as unknown as { current_period_end: number })
                .current_period_end * 1000
            ).toISOString(),
          })
          .eq("id", userProfile.id);
      }
    }

    if (webhook.type === "customer.subscription.deleted") {
      const subscription = webhook.data.object as Stripe.Subscription;

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("stripe_customer_id", subscription.customer as string)
        .single();

      if (userProfile) {
        await supabase
          .from("user_profiles")
          .update({
            subscription_status: "canceled",
            subscription_end_date: new Date(
              (subscription as unknown as { current_period_end: number })
                .current_period_end * 1000
            ).toISOString(),
          })
          .eq("id", userProfile.id);
      }
    }

    return { received: true };
  } catch (error) {
    console.error("Webhook error:", error);
    throw createError({
      statusCode: 400,
      statusMessage: "Webhook error",
    });
  }
});
