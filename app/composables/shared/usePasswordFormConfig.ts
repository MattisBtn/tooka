import type { PasswordFormConfig } from "~/components/shared/ClientPasswordForm.vue";

export const usePasswordFormConfig = () => {
  const getGalleryConfig = (): PasswordFormConfig => ({
    // Visual identity
    icon: "i-heroicons-key",
    smallIcon: "i-heroicons-lock-closed",
    iconBgClass: "bg-gradient-to-br from-primary to-primary",
    smallIconBgClass: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    titleColorClass: "text-primary dark:text-primary",

    // Content
    title: "Accès sécurisé",
    passwordLabel: "Code d'accès",
    passwordDescription: "Entrez votre code de 6 caractères pour continuer",
    inputPlaceholder: "Saisissez le code d'accès",
    submitButtonText: "Accéder à ma galerie",
    helpText: "Code d'accès oublié ? Contactez votre photographe",

    // Messages
    protectedMessage: {
      title: "Galerie protégée",
      description:
        "Cette galerie est protégée par un code d'accès de 6 caractères. Saisissez le code qui vous a été fourni pour consulter vos photos.",
    },
    storedSessionMessage:
      "Une session précédente a été trouvée pour cette galerie. Entrez votre code d'accès pour continuer automatiquement.",

    // Behavior
    usePinInput: true,
    localStorageKey: "gallery_auth_{id}",
  });

  const getMoodboardConfig = (): PasswordFormConfig => ({
    // Visual identity
    icon: "i-lucide-lightbulb",
    smallIcon: "i-lucide-lock",
    iconBgClass: "bg-pink-500",
    smallIconBgClass: "bg-pink-500",
    titleColorClass: "text-pink-600 dark:text-pink-400",

    // Content
    title: "Accès sécurisé",
    passwordLabel: "Code d'accès",
    passwordDescription: "Entrez votre code de 6 caractères",
    inputPlaceholder: "Saisissez le code d'accès",
    submitButtonText: "Accéder au moodboard",
    helpText: "Code d'accès oublié ? Contactez votre photographe",

    // Messages
    protectedMessage: {
      title: "Moodboard protégé",
      description:
        "Ce moodboard est protégé par un code d'accès de 6 caractères. Saisissez le code qui vous a été fourni pour consulter le moodboard d'inspiration.",
    },
    storedSessionMessage:
      "Une session précédente a été trouvée pour ce moodboard. Entrez votre code d'accès pour continuer automatiquement.",

    // Behavior
    usePinInput: true,
    localStorageKey: "moodboard_auth_{id}",
  });

  const getSelectionConfig = (): PasswordFormConfig => ({
    // Visual identity
    icon: "i-lucide-check-square",
    smallIcon: "i-lucide-lock",
    iconBgClass: "bg-amber-500",
    smallIconBgClass: "bg-amber-500",
    titleColorClass: "text-amber-600 dark:text-amber-400",

    // Content
    title: "Accès sécurisé",
    passwordLabel: "Code d'accès",
    passwordDescription: "Entrez votre code de 6 caractères",
    inputPlaceholder: "Saisissez le code d'accès",
    submitButtonText: "Accéder à la sélection",
    helpText: "Code d'accès oublié ? Contactez votre photographe",

    // Messages
    protectedMessage: {
      title: "Sélection protégée",
      description:
        "Cette sélection est protégée par un code d'accès de 6 caractères. Saisissez le code qui vous a été fourni pour accéder à la sélection d'images.",
    },
    storedSessionMessage:
      "Une session précédente a été trouvée pour cette sélection. Entrez votre code d'accès pour continuer automatiquement.",

    // Behavior
    usePinInput: true,
    localStorageKey: "selection_auth_{id}",
  });

  const getProposalConfig = (): PasswordFormConfig => ({
    // Visual identity
    icon: "i-lucide-lock",
    smallIcon: "i-lucide-lock",
    iconBgClass: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    smallIconBgClass: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    titleColorClass: "text-emerald-600 dark:text-emerald-400",

    // Content
    title: "Accès protégé",
    passwordLabel: "Code d'accès",
    passwordDescription: "Entrez votre code de 6 caractères",
    inputPlaceholder: "Saisissez le code d'accès",
    submitButtonText: "Accéder à la proposition",
    helpText: "Code d'accès oublié ? Contactez votre photographe",

    // Messages
    protectedMessage: {
      title: "Proposition protégée",
      description:
        "Cette proposition est protégée par un code d'accès de 6 caractères. Saisissez le code qui vous a été fourni pour consulter la proposition.",
    },
    storedSessionMessage:
      "Une session précédente a été trouvée pour cette proposition. Entrez votre code d'accès pour continuer automatiquement.",

    // Behavior
    usePinInput: true,
    localStorageKey: "proposal_auth_{id}",
  });

  return {
    getGalleryConfig,
    getMoodboardConfig,
    getSelectionConfig,
    getProposalConfig,
  };
};
