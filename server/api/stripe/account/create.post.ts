import { serverSupabaseClient } from "#supabase/server";
import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user_id } = body;

  if (!user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID is required",
    });
  }

  const config = useRuntimeConfig();
  const supabase = await serverSupabaseClient(event);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    // Vérifier si l'utilisateur a déjà un compte Stripe
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("stripe_account_id")
      .eq("id", user_id)
      .single();

    if (existingProfile?.stripe_account_id) {
      // Si le compte existe, créer juste un nouveau lien d'onboarding
      const accountLink = await stripe.accountLinks.create({
        account: existingProfile.stripe_account_id,
        refresh_url: `${
          config.public.baseUrl || "http://localhost:3000"
        }/me?tab=billing&refresh=true`,
        return_url: `${
          config.public.baseUrl || "http://localhost:3000"
        }/me?tab=billing&success=true`,
        type: "account_onboarding",
      });

      return {
        session: {
          url: accountLink.url,
          account_id: existingProfile.stripe_account_id,
        },
      };
    }

    // Créer un nouveau compte Express
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: body.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Créer le lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${
        config.public.baseUrl || "http://localhost:3000"
      }/me?tab=billing&refresh=true`,
      return_url: `${
        config.public.baseUrl || "http://localhost:3000"
      }/me?tab=billing&success=true`,
      type: "account_onboarding",
    });

    // Sauvegarder dans la base de données
    await supabase.from("user_profiles").upsert({
      id: user_id,
      stripe_account_id: account.id,
      stripe_account_status: "pending",
      stripe_details_submitted: false,
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_connected_at: new Date().toISOString(),
    });

    return {
      session: {
        url: accountLink.url,
        account_id: account.id,
      },
    };
  } catch (error) {
    console.error("Stripe account creation error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create Stripe account",
    });
  }
});
