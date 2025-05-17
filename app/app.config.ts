export default defineAppConfig({
  // https://ui.nuxt.com/getting-started/theme#design-system
  ui: {
    colors: {
      primary: "blue",
      neutral: "slate",
    },
    button: {
      defaultVariants: {
        size: "xl",
        // Set default button color to neutral
        // color: 'neutral'
      },
    },
    input: {
      defaultVariants: {
        size: "xl",
      },
    },
  },
});
