export default defineAppConfig({
  // https://ui.nuxt.com/getting-started/theme#design-system
  ui: {
    colors: {
      primary: "black",
      neutral: "zinc",
    },
    button: {
      defaultVariants: {
        size: "md",
        color: "neutral",
        variant: "solid",
      },
      slots: {
        base: "inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 ease-out rounded-lg",
      },
      variants: {
        soft: {
          base: "inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 ease-out rounded-lg shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.7)] hover:shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.8)] hover:scale-105 hover:-translate-y-0.5 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] active:scale-95 active:translate-y-0",
        },
        outline: {
          base: "inline-flex items-center justify-center gap-2 font-medium border transition-all duration-300 ease-out rounded-lg shadow-sm hover:shadow-md hover:scale-105 hover:-translate-y-0.5 active:shadow-inner active:scale-95 active:translate-y-0",
        },
        ghost: {
          base: "inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 ease-out rounded-lg shadow-sm hover:shadow-md hover:scale-105 hover:-translate-y-0.5 active:shadow-inner active:scale-95 active:translate-y-0",
        },
        solid: {
          base: "inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 ease-out rounded-lg shadow-[3px_3px_6px_rgba(0,0,0,0.15),-3px_-3px_6px_rgba(255,255,255,0.8)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.2),-6px_-6px_12px_rgba(255,255,255,0.9)] hover:scale-105 hover:-translate-y-1 active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] active:scale-95 active:translate-y-0",
        },
      },
      sizes: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-sm",
        xl: "h-11 px-6 text-base",
      },
    },
    input: {
      defaultVariants: {
        size: "md",
        variant: "outline",
      },
    },
    selectMenu: {
      defaultVariants: {
        size: "md",
        variant: "outline",
      },
    },
    textarea: {
      defaultVariants: {
        size: "md",
        variant: "outline",
      },
    },
    inputMenu: {
      defaultVariants: {
        size: "md",
        variant: "outline",
      },
    },
    fileUpload: {
      variants: {
        layout: {
          list: {
            files: "max-h-48 overflow-auto",
          },
        },
      },
    },
  },
});
