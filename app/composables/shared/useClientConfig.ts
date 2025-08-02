import type { FooterConfig } from "~/components/shared/ClientFooter.vue";
import type { ErrorStateConfig } from "~/components/shared/ErrorState.vue";

export const useClientConfig = () => {
  const getGalleryErrorConfig = (): ErrorStateConfig => ({
    title: "Galerie non trouvée",
    description: "Cette galerie n'existe pas ou n'est plus accessible.",
    helpText: "Vérifiez le lien fourni ou contactez votre photographe.",
  });

  const getMoodboardErrorConfig = (): ErrorStateConfig => ({
    title: "Moodboard non trouvé",
    description: "Ce moodboard n'existe pas ou n'est plus accessible.",
    helpText: "Vérifiez le lien fourni ou contactez votre photographe.",
  });

  const getSelectionErrorConfig = (): ErrorStateConfig => ({
    title: "Sélection non trouvée",
    description: "Cette sélection n'existe pas ou n'est plus accessible.",
    helpText: "Vérifiez le lien fourni ou contactez votre photographe.",
  });

  const getProposalErrorConfig = (): ErrorStateConfig => ({
    title: "Proposition non trouvée",
    description: "Cette proposition n'existe pas ou n'est plus accessible.",
    helpText: "Vérifiez le lien fourni ou contactez votre photographe.",
  });

  const getGalleryFooterConfig = (): FooterConfig => ({
    brandColorClass: "text-primary-600 dark:text-primary-400",
  });

  const getMoodboardFooterConfig = (): FooterConfig => ({
    brandColorClass: "text-pink-600 dark:text-pink-400",
  });

  const getSelectionFooterConfig = (): FooterConfig => ({
    brandColorClass: "text-amber-600 dark:text-amber-400",
  });

  const getProposalFooterConfig = (): FooterConfig => ({
    brandColorClass: "text-primary-600 dark:text-primary-400",
  });

  return {
    // Error state configs
    getGalleryErrorConfig,
    getMoodboardErrorConfig,
    getSelectionErrorConfig,
    getProposalErrorConfig,
    // Footer configs
    getGalleryFooterConfig,
    getMoodboardFooterConfig,
    getSelectionFooterConfig,
    getProposalFooterConfig,
  };
};
