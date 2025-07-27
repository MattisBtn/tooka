export const useLogo = () => {
  const colorMode = useColorMode();

  const logoSrc = computed(() => {
    return colorMode.value === "dark"
      ? "/images/logo-white.png"
      : "/images/logo-dark.png";
  });

  return {
    logoSrc,
  };
};
