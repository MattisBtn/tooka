import { serverSupabaseServiceRole } from "#supabase/server";
import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, "id");

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID is required",
    });
  }

  const supabase = await serverSupabaseServiceRole(event);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    // Récupérer l'ID du compte Stripe depuis la base de données
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .single();

    if (profileError) {
      if (profileError.code === "PGRST116") {
        throw createError({
          statusCode: 404,
          statusMessage: "User profile not found",
        });
      }
      throw new Error(`Database error: ${profileError.message}`);
    }

    if (!profile?.stripe_account_id) {
      throw createError({
        statusCode: 404,
        statusMessage: "No Stripe account found for this user",
      });
    }

    // Créer le lien de connexion au dashboard Stripe
    const loginLink = await stripe.accounts.createLoginLink(
      profile.stripe_account_id
    );

    return {
      url: loginLink.url,
    };
  } catch (error) {
    console.error("Stripe dashboard link error:", error);

    if (error instanceof Error && "statusCode" in error) {
      throw error; // Re-throw les erreurs createError
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create dashboard link",
    });
  }
});
