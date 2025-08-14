// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    "@nuxt/ui",
    "@nuxt/eslint",
    "@nuxt/image",
    "@vueuse/nuxt",
    "@nuxtjs/supabase",
    "@pinia/nuxt",
    "@nuxtjs/device",
  ],

  css: ["~/assets/css/main.css"],

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: "2024-11-27",

  imports: {
    dirs: ["stores/admin/**", "stores/public/**"],
  },

  supabase: {
    redirectOptions: {
      login: "/login",
      callback: "/auth/callback",
      exclude: [
        "/register",
        "/login",
        "/reset-password",
        "/forgot-password",
        "/moodboard/*",
        "/selection/*",
        "/gallery/*",
        "/proposal/*",
        "/api/stripe/webhooks",
      ],
    },
  },

  runtimeConfig: {
    public: {
      companySearchApiUrl: "https://recherche-entreprises.api.gouv.fr",
      STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
      baseUrl: process.env.BASE_URL || "http://localhost:3000",
    },
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  },
});