import type { ErrorStateConfig } from "~/components/shared/ErrorState.vue";

export const useClientConfig = () => {
  const getGalleryErrorConfig = (): ErrorStateConfig => ({
    title: "Oups ! Galerie introuvable",
    description:
      "Cette galerie semble avoir disparu dans le cyberespace. Pas de panique, nous sommes là pour vous aider !",
    helpText:
      "Vérifiez le lien fourni ou contactez votre photographe pour obtenir un nouveau lien. Notre équipe est là pour vous accompagner !",
    actions: [
      {
        label: "Retour à l'accueil",
        variant: "outline",
        icon: "i-heroicons-home",
        to: "/",
      },
      {
        label: "Contacter le photographe",
        variant: "solid",
        color: "primary",
        icon: "i-heroicons-envelope",
        onClick: () => {
          window.location.href = "mailto:contact@tooka.io";
        },
      },
    ],
    contactInfo: "Besoin d'aide ? Contactez-nous à contact@tooka.io",
  });

  const getMoodboardErrorConfig = (): ErrorStateConfig => ({
    title: "Oups ! Moodboard introuvable",
    description:
      "Ce moodboard semble avoir disparu dans le cyberespace. Pas de panique, nous sommes là pour vous aider !",
    helpText:
      "Vérifiez le lien fourni ou contactez votre photographe pour obtenir un nouveau lien. Notre équipe est là pour vous accompagner !",
    actions: [
      {
        label: "Retour à l'accueil",
        variant: "outline",
        icon: "i-heroicons-home",
        to: "/",
      },
      {
        label: "Contacter le photographe",
        variant: "solid",
        color: "primary",
        icon: "i-heroicons-envelope",
        onClick: () => {
          window.location.href = "mailto:contact@tooka.io";
        },
      },
    ],
    contactInfo: "Besoin d'aide ? Contactez-nous à contact@tooka.io",
  });

  const getSelectionErrorConfig = (): ErrorStateConfig => ({
    title: "Oups ! Sélection introuvable",
    description:
      "Cette sélection semble avoir disparu dans le cyberespace. Pas de panique, nous sommes là pour vous aider !",
    helpText:
      "Vérifiez le lien fourni ou contactez votre photographe pour obtenir un nouveau lien. Notre équipe est là pour vous accompagner !",
    actions: [
      {
        label: "Retour à l'accueil",
        variant: "outline",
        icon: "i-heroicons-home",
        to: "/",
      },
      {
        label: "Contacter le photographe",
        variant: "solid",
        color: "primary",
        icon: "i-heroicons-envelope",
        onClick: () => {
          window.location.href = "mailto:contact@tooka.io";
        },
      },
    ],
    contactInfo: "Besoin d'aide ? Contactez-nous à contact@tooka.io",
  });

  const getProposalErrorConfig = (): ErrorStateConfig => ({
    title: "Oups ! Proposition introuvable",
    description:
      "Cette proposition semble avoir disparu dans le cyberespace. Pas de panique, nous sommes là pour vous aider !",
    helpText:
      "Vérifiez le lien fourni ou contactez votre photographe pour obtenir un nouveau lien. Notre équipe est là pour vous accompagner !",
    actions: [
      {
        label: "Retour à l'accueil",
        variant: "outline",
        icon: "i-heroicons-home",
        to: "/",
      },
      {
        label: "Contacter le photographe",
        variant: "solid",
        color: "primary",
        icon: "i-heroicons-envelope",
        onClick: () => {
          window.location.href = "mailto:contact@tooka.io";
        },
      },
    ],
    contactInfo: "Besoin d'aide ? Contactez-nous à contact@tooka.io",
  });

  return {
    // Error state configs
    getGalleryErrorConfig,
    getMoodboardErrorConfig,
    getSelectionErrorConfig,
    getProposalErrorConfig,
  };
};
