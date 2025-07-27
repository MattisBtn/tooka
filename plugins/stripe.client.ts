import { defineNuxtPlugin } from "#app";
import type { Stripe } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";

export default defineNuxtPlugin(async (nuxtApp) => {
  const stripeKey = useRuntimeConfig().public.STRIPE_PUBLIC_KEY;
  const stripe = (await loadStripe(stripeKey as string)) as Stripe;

  nuxtApp.provide("stripe", stripe);
});
