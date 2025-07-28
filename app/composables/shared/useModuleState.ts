/**
 * Composable centralisé pour gérer l'état des modules d'un projet
 * Suit les patterns KISS et YAGNI - évite la duplication d'imports
 */
export const useModuleState = (projectId: string) => {
  // État global pour tous les modules d'un projet
  const moduleConfig = useState(`project-modules-${projectId}`, () => ({
    proposal: {
      enabled: false,
      configured: false,
      loading: false,
      showForm: false,
    },
    moodboard: {
      enabled: false,
      configured: false,
      loading: false,
      showForm: false,
    },
    selection: {
      enabled: false,
      configured: false,
      loading: false,
    },
    gallery: {
      enabled: false,
      configured: false,
      loading: false,
    },
  }));

  // Méthodes pour gérer l'état
  const enableModule = (
    moduleName: keyof typeof moduleConfig.value,
    options: { showForm?: boolean } = {}
  ) => {
    moduleConfig.value[moduleName].enabled = true;
    moduleConfig.value[moduleName].loading = false;

    if (moduleName === "proposal") {
      moduleConfig.value.proposal.showForm = options.showForm || false;
    }
    if (moduleName === "moodboard") {
      moduleConfig.value.moodboard.showForm = options.showForm || false;
    }
  };

  const configureModule = (moduleName: keyof typeof moduleConfig.value) => {
    moduleConfig.value[moduleName].configured = true;
    moduleConfig.value[moduleName].loading = false;

    if (moduleName === "proposal") {
      moduleConfig.value.proposal.showForm = false;
    }
    if (moduleName === "moodboard") {
      moduleConfig.value.moodboard.showForm = false;
    }
  };

  const resetModule = (moduleName: keyof typeof moduleConfig.value) => {
    moduleConfig.value[moduleName].enabled = false;
    moduleConfig.value[moduleName].configured = false;
    moduleConfig.value[moduleName].loading = false;

    if (moduleName === "proposal") {
      moduleConfig.value.proposal.showForm = false;
    }
    if (moduleName === "moodboard") {
      moduleConfig.value.moodboard.showForm = false;
    }
  };

  // Computed pour savoir si on peut continuer à l'étape suivante
  const canContinueToNextStep = (currentStep: number) => {
    const steps = ["proposal", "moodboard", "selection", "gallery"] as const;
    const currentModule = steps[currentStep - 1];

    if (!currentModule) return false;

    return moduleConfig.value[currentModule].configured;
  };

  return {
    moduleConfig: readonly(moduleConfig),
    enableModule,
    configureModule,
    resetModule,
    canContinueToNextStep,
  };
};
