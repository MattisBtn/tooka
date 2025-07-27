export default defineAppConfig({
  // https://ui.nuxt.com/getting-started/theme#design-system
  ui: {
    colors: {
      primary: "black",
      neutral: "zinc",
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
    selectMenu: {
      defaultVariants: {
        size: "xl",
      },
    },
    textarea: {
      defaultVariants: {
        size: "xl",
      },
    },
    inputMenu: {
      defaultVariants: {
        size: "xl",
      },
    },
  },
});
