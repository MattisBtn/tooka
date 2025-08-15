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

  return {
    // Error state configs
    getGalleryErrorConfig,
    getMoodboardErrorConfig,
    getSelectionErrorConfig,
    getProposalErrorConfig,
  };
};
