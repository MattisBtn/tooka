/**
 * Composable centralisé pour gérer l'état des modules d'un projet
 */
import type { ProjectWithClient, WorkflowStep } from "~/types/project";

export const useModuleState = (projectId: string) => {
  // État global pour tous les modules d'un projet
  const moduleConfig = useState(`project-modules-${projectId}`, () => ({
    proposal: {
      enabled: false,
      configured: false,
      skipped: false,
      loading: false,
      showForm: false,
    },
    moodboard: {
      enabled: false,
      configured: false,
      skipped: false,
      loading: false,
      showForm: false,
    },
    selection: {
      enabled: false,
      configured: false,
      skipped: false,
      loading: false,
      showForm: false,
    },
    gallery: {
      enabled: false,
      configured: false,
      skipped: false,
      loading: false,
      showForm: false,
    },
  }));

  // Project data state
  const project = useState<ProjectWithClient | null>(
    `project-data-${projectId}`,
    () => null
  );
  const projectLoading = useState(`project-loading-${projectId}`, () => false);

  // Méthodes pour gérer l'état
  const enableModule = (
    moduleName: keyof typeof moduleConfig.value,
    options: { showForm?: boolean } = {}
  ) => {
    moduleConfig.value[moduleName].enabled = true;
    moduleConfig.value[moduleName].skipped = false;
    moduleConfig.value[moduleName].loading = false;

    if (moduleName === "proposal") {
      moduleConfig.value.proposal.showForm = options.showForm || false;
    }
    if (moduleName === "moodboard") {
      moduleConfig.value.moodboard.showForm = options.showForm || false;
    }
    if (moduleName === "selection") {
      moduleConfig.value.selection.showForm = options.showForm || false;
    }
    if (moduleName === "gallery") {
      moduleConfig.value.gallery.showForm = options.showForm || false;
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
    if (moduleName === "selection") {
      moduleConfig.value.selection.showForm = false;
    }
    if (moduleName === "gallery") {
      moduleConfig.value.gallery.showForm = false;
    }
  };

  const skipModule = (moduleName: keyof typeof moduleConfig.value) => {
    moduleConfig.value[moduleName].configured = true;
    moduleConfig.value[moduleName].skipped = true;
    moduleConfig.value[moduleName].enabled = false;
    moduleConfig.value[moduleName].loading = false;

    if (moduleName === "proposal") {
      moduleConfig.value.proposal.showForm = false;
    }
    if (moduleName === "moodboard") {
      moduleConfig.value.moodboard.showForm = false;
    }
    if (moduleName === "selection") {
      moduleConfig.value.selection.showForm = false;
    }
    if (moduleName === "gallery") {
      moduleConfig.value.gallery.showForm = false;
    }
  };

  const resetModule = (moduleName: keyof typeof moduleConfig.value) => {
    moduleConfig.value[moduleName].enabled = false;
    moduleConfig.value[moduleName].configured = false;
    moduleConfig.value[moduleName].skipped = false;
    moduleConfig.value[moduleName].loading = false;

    if (moduleName === "proposal") {
      moduleConfig.value.proposal.showForm = false;
    }
    if (moduleName === "moodboard") {
      moduleConfig.value.moodboard.showForm = false;
    }
    if (moduleName === "selection") {
      moduleConfig.value.selection.showForm = false;
    }
    if (moduleName === "gallery") {
      moduleConfig.value.gallery.showForm = false;
    }
  };

  // Méthode pour charger les données du projet
  const loadProject = async () => {
    if (projectLoading.value) return;

    projectLoading.value = true;
    try {
      const { projectService } = await import("~/services/projectService");
      const projectData = await projectService.getProjectById(projectId);
      project.value = projectData;
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      projectLoading.value = false;
    }
  };

  // Méthode pour démarrer le workflow
  const startWorkflow = async () => {
    if (!project.value) return;

    try {
      const { projectService } = await import("~/services/projectService");
      await projectService.startWorkflow(projectId);
      await loadProject(); // Recharger les données
    } catch (error) {
      console.error("Error starting workflow:", error);
      throw error;
    }
  };

  // Méthode pour passer à l'étape suivante
  const goToNextStep = async (currentStep: number) => {
    const nextStep = currentStep + 1;
    if (nextStep > 4) return;

    try {
      const { projectService } = await import("~/services/projectService");
      await projectService.updateWorkflowStep(
        projectId,
        nextStep as WorkflowStep
      );
      await loadProject(); // Recharger les données
    } catch (error) {
      console.error("Error updating workflow step:", error);
      throw error;
    }
  };

  // Méthode pour naviguer directement vers un step
  const navigateToStep = async (stepNumber: WorkflowStep) => {
    try {
      const { projectService } = await import("~/services/projectService");
      await projectService.updateWorkflowStep(projectId, stepNumber);
      await loadProject(); // Recharger les données
    } catch (error) {
      console.error("Error navigating to step:", error);
      throw error;
    }
  };

  // Méthode pour vérifier si un step est configuré (a un statut en base)
  const isStepConfigured = (stepNumber: WorkflowStep): boolean => {
    if (!project.value) return false;

    const stepModuleMap = {
      1: "proposal" as const,
      2: "moodboard" as const,
      3: "selection" as const,
      4: "gallery" as const,
    };

    const moduleName = stepModuleMap[stepNumber];
    const moduleData = project.value[moduleName];

    // Gérer le cas où moduleData est un tableau (API retourne un tableau)
    if (Array.isArray(moduleData)) {
      return moduleData.length > 0;
    }

    // Un step est configuré s'il a un statut en base (même draft)
    return moduleData !== null && moduleData !== undefined;
  };

  // Méthode pour vérifier si un step est en cours de configuration
  const isStepInProgress = (stepNumber: WorkflowStep): boolean => {
    if (!project.value) return false;

    const stepModuleMap = {
      1: "proposal" as const,
      2: "moodboard" as const,
      3: "selection" as const,
      4: "gallery" as const,
    };

    const moduleName = stepModuleMap[stepNumber];
    const moduleData = project.value[moduleName];

    // Gérer le cas où moduleData est un tableau
    if (Array.isArray(moduleData)) {
      return moduleData.length > 0 && moduleData[0].status !== "completed";
    }

    // Un step est en cours s'il existe mais n'est pas terminé
    return (
      moduleData !== null &&
      moduleData !== undefined &&
      moduleData.status !== "completed"
    );
  };

  // Méthode pour vérifier s'il y a un step en cours
  const hasStepInProgress = (): boolean => {
    for (let i = 1; i <= 4; i++) {
      if (isStepInProgress(i as WorkflowStep)) {
        return true;
      }
    }
    return false;
  };

  // Méthode pour obtenir le step en cours
  const getStepInProgress = (): WorkflowStep | null => {
    for (let i = 1; i <= 4; i++) {
      if (isStepInProgress(i as WorkflowStep)) {
        return i as WorkflowStep;
      }
    }
    return null;
  };

  // Méthode pour vérifier si un step peut être configuré
  const isStepConfigurable = (stepNumber: WorkflowStep): boolean => {
    if (!project.value) return false;

    // Si un step est en cours, seul ce step peut être configuré
    const stepInProgress = getStepInProgress();
    if (stepInProgress && stepInProgress !== stepNumber) {
      return false;
    }

    // Vérifier si un step plus avancé est configuré
    for (let i = stepNumber + 1; i <= 4; i++) {
      if (isStepConfigured(i as WorkflowStep)) {
        return false; // Un step plus avancé est configuré, donc celui-ci n'est pas configurable
      }
    }

    return true; // Aucun step plus avancé n'est configuré et aucun step n'est en cours
  };

  // Méthode pour vérifier si un step peut être consulté (même s'il est verrouillé)
  const canViewStep = (stepNumber: WorkflowStep): boolean => {
    if (!project.value) return false;

    // Si un step est en cours, on ne peut consulter que ce step ou les steps terminés
    const stepInProgress = getStepInProgress();
    if (stepInProgress) {
      // Si on demande le step en cours, on peut le consulter
      if (stepNumber === stepInProgress) {
        return true;
      }

      // Si on demande un step terminé, on peut le consulter
      if (isStepConfigured(stepNumber)) {
        const stepModuleMap = {
          1: "proposal" as const,
          2: "moodboard" as const,
          3: "selection" as const,
          4: "gallery" as const,
        };
        const moduleName = stepModuleMap[stepNumber];
        const moduleData = project.value[moduleName];
        const actualModuleData = Array.isArray(moduleData)
          ? moduleData[0]
          : moduleData;

        return actualModuleData?.status === "completed";
      }

      // Sinon, on ne peut pas consulter d'autres steps
      return false;
    }

    // Si aucun step n'est en cours, on peut consulter tous les steps
    return true;
  };

  // Méthode pour obtenir le statut d'un step
  const getStepStatus = (stepNumber: WorkflowStep) => {
    if (!project.value) return null;

    const stepModuleMap = {
      1: "proposal" as const,
      2: "moodboard" as const,
      3: "selection" as const,
      4: "gallery" as const,
    };

    const moduleName = stepModuleMap[stepNumber];
    const moduleData = project.value[moduleName];

    if (!moduleData) return null;

    // Gérer le cas où moduleData est un tableau
    const actualModuleData = Array.isArray(moduleData)
      ? moduleData[0]
      : moduleData;
    if (!actualModuleData) return null;

    return {
      isConfigured: true,
      status: actualModuleData.status,
      isConfigurable: isStepConfigurable(stepNumber),
      canView: canViewStep(stepNumber),
    };
  };

  // Méthode pour obtenir le statut d'affichage d'un step
  const getStepDisplayStatus = (stepNumber: WorkflowStep) => {
    if (!project.value) return null;

    const stepModuleMap = {
      1: "proposal" as const,
      2: "moodboard" as const,
      3: "selection" as const,
      4: "gallery" as const,
    };

    const moduleName = stepModuleMap[stepNumber];
    const moduleData = project.value[moduleName];

    // Gérer le cas où moduleData est un tableau
    const actualModuleData = Array.isArray(moduleData)
      ? moduleData[0]
      : moduleData;

    // Step configuré
    if (actualModuleData) {
      return {
        status:
          actualModuleData.status === "completed" ? "completed" : "in_progress",
        isConfigurable: isStepConfigurable(stepNumber),
        canView: canViewStep(stepNumber),
        isDisabled: !canViewStep(stepNumber),
      };
    }

    // Step non configuré
    const stepInProgress = getStepInProgress();
    if (stepInProgress && stepNumber > stepInProgress) {
      return {
        status: "locked",
        isConfigurable: false,
        canView: false,
        isDisabled: true,
      };
    }

    return {
      status: "available",
      isConfigurable: isStepConfigurable(stepNumber),
      canView: canViewStep(stepNumber),
      isDisabled: false,
    };
  };

  // Computed pour savoir si on peut continuer à l'étape suivante
  const canContinueToNextStep = (currentStep: number) => {
    const steps = ["proposal", "moodboard", "selection", "gallery"] as const;
    const currentModule = steps[currentStep - 1];

    if (!currentModule || !project.value) return false;

    const moduleState = moduleConfig.value[currentModule];
    const moduleData = project.value[currentModule];

    // Cas spécial pour l'étape 4 (gallery) : si la galerie est completed, on peut terminer
    if (currentStep === 4 && moduleData?.status === "completed") {
      return true;
    }

    // Cas 1: Module ignoré explicitement
    if (moduleState.skipped) {
      return true;
    }

    // Cas 2: Module activé mais pas encore configuré
    if (moduleState.enabled && !moduleState.configured) {
      return false;
    }

    // Cas 3: Module configuré et terminé
    if (moduleState.configured && moduleData?.status === "completed") {
      return true;
    }

    // Cas 4: Module existant déjà en base (comme moodboard existant)
    if (moduleData && moduleData.status === "completed") {
      return true;
    }

    // Par défaut, ne peut pas continuer
    return false;
  };

  // Computed pour vérifier si un module peut être modifié
  const canEditModule = (moduleName: keyof typeof moduleConfig.value) => {
    if (!project.value) return false;

    const moduleStepMap = {
      proposal: 1,
      moodboard: 2,
      selection: 3,
      gallery: 4,
    } as const;

    const step = moduleStepMap[moduleName];
    const currentStep = project.value.workflow_step || 1;

    // Can edit if it's the current step or a future step
    return step >= currentStep;
  };

  // Computed pour vérifier si un module peut être supprimé
  const canDeleteModule = (moduleName: keyof typeof moduleConfig.value) => {
    if (!project.value) return false;

    const moduleStepMap = {
      proposal: 1,
      moodboard: 2,
      selection: 3,
      gallery: 4,
    } as const;

    const step = moduleStepMap[moduleName];
    const currentStep = project.value.workflow_step || 1;
    const moduleData = project.value[moduleName];
    const isCompleted = moduleData?.status === "completed";

    // Can delete if it's the current step and not completed
    return step === currentStep && !isCompleted;
  };

  // Computed pour vérifier si un module est terminé
  const isModuleCompleted = (moduleName: keyof typeof moduleConfig.value) => {
    if (!project.value) return false;

    const moduleData = project.value[moduleName];
    return moduleData?.status === "completed";
  };

  // Computed pour vérifier si un module a été ignoré
  const isModuleSkipped = (moduleName: keyof typeof moduleConfig.value) => {
    return moduleConfig.value[moduleName].skipped;
  };

  // Méthode pour resynchroniser le state après suppression d'un module
  const resyncAfterModuleDeletion = async (
    moduleName: keyof typeof moduleConfig.value
  ) => {
    try {
      // Recharger les données du projet
      await loadProject();

      // Reset le state du module supprimé
      resetModule(moduleName);

      // Reconfigurer les modules existants
      if (project.value) {
        const moduleKeys = [
          "proposal",
          "moodboard",
          "selection",
          "gallery",
        ] as const;

        for (const moduleKey of moduleKeys) {
          const moduleData = project.value[moduleKey];

          // Si le module existe en base, le configurer
          if (
            moduleData &&
            (Array.isArray(moduleData)
              ? moduleData.length > 0
              : moduleData !== null)
          ) {
            enableModule(moduleKey, { showForm: false });
            configureModule(moduleKey);
          }
        }
      }
    } catch (error) {
      console.error("Error resyncing after module deletion:", error);
      throw error;
    }
  };

  return {
    moduleConfig: readonly(moduleConfig),
    project: readonly(project),
    projectLoading: readonly(projectLoading),
    enableModule,
    configureModule,
    skipModule,
    resetModule,
    canContinueToNextStep,
    canEditModule,
    canDeleteModule,
    isModuleCompleted,
    isModuleSkipped,
    loadProject,
    startWorkflow,
    goToNextStep,
    navigateToStep,
    isStepConfigured,
    isStepConfigurable,
    canViewStep,
    getStepStatus,
    isStepInProgress,
    hasStepInProgress,
    getStepInProgress,
    getStepDisplayStatus,
    resyncAfterModuleDeletion,
  };
};
