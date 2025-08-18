import type { SimpleHeaderConfig } from "~/components/shared/SimpleHeader.vue";

export const useSimpleHeaderConfig = () => {
  const getGalleryConfig = (): SimpleHeaderConfig => ({
    icon: "i-heroicons-camera",
    iconBgClass: "bg-primary",
    showLogo: true,
    showColorToggle: true,
  });

  const getMoodboardConfig = (): SimpleHeaderConfig => ({
    icon: "i-heroicons-camera",
    iconBgClass: "bg-primary",
    showLogo: true,
    showColorToggle: true,
  });

  const getSelectionConfig = (): SimpleHeaderConfig => ({
    icon: "i-heroicons-camera",
    iconBgClass: "bg-amber-500",
    showLogo: true,
    showColorToggle: true,
  });

  const getProposalConfig = (): SimpleHeaderConfig => ({
    icon: "i-lucide-file-check",
    iconBgClass: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    title: "Proposition",
    showLogo: false,
    showColorToggle: false,
  });

  return {
    getGalleryConfig,
    getMoodboardConfig,
    getSelectionConfig,
    getProposalConfig,
  };
};
