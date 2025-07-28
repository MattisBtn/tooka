/**
 * Composable centralisé pour gérer l'état des modules d'un projet
 * Suit les patterns KISS et YAGNI - évite la duplication d'imports
 */
import type { ProjectWithClient, WorkflowStep } from "~/types/project";

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

  // Computed pour savoir si on peut continuer à l'étape suivante
  const canContinueToNextStep = (currentStep: number) => {
    const steps = ["proposal", "moodboard", "selection", "gallery"] as const;
    const currentModule = steps[currentStep - 1];

    if (!currentModule || !project.value) return false;

    // Vérifier si le module est configuré
    const moduleConfigured = moduleConfig.value[currentModule].configured;

    // Vérifier si l'étape courante est terminée
    const currentModuleData = project.value[currentModule];
    const currentStepCompleted = currentModuleData?.status === "completed";

    return moduleConfigured && currentStepCompleted;
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

  return {
    moduleConfig: readonly(moduleConfig),
    project: readonly(project),
    projectLoading: readonly(projectLoading),
    enableModule,
    configureModule,
    resetModule,
    canContinueToNextStep,
    canEditModule,
    canDeleteModule,
    isModuleCompleted,
    loadProject,
    startWorkflow,
    goToNextStep,
  };
};
