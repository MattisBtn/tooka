// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    "@nuxt/ui",
    "@nuxt/eslint",
    "@nuxt/image",
    "@vueuse/nuxt",
    "@nuxtjs/supabase",
  ],

  css: ["~/assets/css/main.css"],

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: "2024-11-27",

  supabase: {
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: [
        "/register",
        "/login",
        "/reset-password",
        "/moodboard/*",
        "/selection/*",
        "/gallery/*",
        "/proposal/*",
      ],
    },
  },

  runtimeConfig: {
    public: {
      conversionServiceUrl:
        process.env.CONVERSION_SERVICE_URL ||
        "https://tooka-converter-service-production.up.railway.app",
      companySearchApiUrl: "https://recherche-entreprises.api.gouv.fr",
    },
  },
});
