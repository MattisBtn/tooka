import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.subscription_id || !body.price_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Subscription ID and Price ID are required",
    });
  }

  const { subscription_id, price_id } = body;
  const config = useRuntimeConfig();
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

  try {
    // Récupérer l'abonnement actuel
    const subscription = await stripe.subscriptions.retrieve(subscription_id);
    const currentItem = subscription.items.data[0];

    // Mettre à jour l'abonnement avec le nouveau prix
    await stripe.subscriptions.update(subscription_id, {
      items: [
        {
          id: currentItem.id,
          deleted: true,
        },
        {
          price: price_id,
        },
      ],
      proration_behavior: "create_prorations",
    });

    return { success: true };
  } catch (error) {
    console.error("Subscription update error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      throw createError({
        statusCode: 400,
        statusMessage: `Stripe error: ${error.message}`,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update subscription",
    });
  }
});
