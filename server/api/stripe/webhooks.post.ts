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

        console.log("Subscription details:", subscription);

        // Calculer la date de fin en utilisant billing_cycle_anchor + interval
        let subscriptionEndDate: string | null = null;

        if (subscription.billing_cycle_anchor) {
          // Utiliser billing_cycle_anchor comme base et ajouter la durée de l'interval
          const _billingCycleAnchor = subscription.billing_cycle_anchor * 1000;
          const now = Date.now();

          // Si la subscription est active, calculer la prochaine date de facturation
          if (
            subscription.status === "active" ||
            subscription.status === "trialing"
          ) {
            // Utiliser la date actuelle + 1 mois comme approximation
            // (cette logique peut être améliorée selon vos besoins)
            const nextBillingDate = new Date(now);
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            subscriptionEndDate = nextBillingDate.toISOString();
          }
        }

        const { error } = await supabase
          .from("user_profiles")
          .update({
            subscription_status: "active",
            stripe_subscription_id: session.subscription as string,
            subscription_end_date: subscriptionEndDate,
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
            subscription_end_date: subscription.ended_at
              ? new Date(subscription.ended_at * 1000).toISOString()
              : null,
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
