import { projectRepository } from "~/repositories/projectRepository";
import type {
  IPagination,
  IProjectFilters,
  Project,
  ProjectWithClient,
  WorkflowStep,
  WorkflowStepInfo,
  WorkflowValidation,
} from "~/types/project";

export const projectService = {
  /**
   * Fetch projects with pagination and filtering
   */
  async getProjects(
    filters: IProjectFilters = {},
    pagination: IPagination
  ): Promise<ProjectWithClient[]> {
    const projects = await projectRepository.findMany(filters, pagination);

    // Business logic: sort by status priority
    return projects.sort((a, b) => {
      const statusOrder = { draft: 0, in_progress: 1, completed: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  },

  /**
   * Get project by ID with validation
   */
  async getProjectById(id: string): Promise<ProjectWithClient> {
    if (!id?.trim()) {
      throw new Error("Project ID is required");
    }

    const project = await projectRepository.findById(id);

    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  },

  /**
   * Create new project with validation and conditional password generation
   */
  async createProject(
    projectData: Omit<
      Project,
      | "id"
      | "created_at"
      | "updated_at"
      | "user_id"
      | "password_hash"
      | "password_expires_at"
      | "workflow_started_at"
      | "workflow_completed_at"
      | "workflow_step"
    > & {
      require_password?: boolean;
    }
  ): Promise<ProjectWithClient> {
    // Get current user from Supabase
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour créer un projet");
    }

    if (!projectData.client_id?.trim()) {
      throw new Error("Client is required");
    }

    // Extract require_password from projectData
    const { require_password, ...dbProjectData } = projectData;

    // Generate password only if required
    const passwordHash = require_password ? this.generatePassword() : "";

    // Add user_id and generated fields
    const dataWithUserAndSecurity = {
      ...dbProjectData,
      user_id: user.value.id,
      password_hash: passwordHash,
      password_expires_at: null, // Always null now since expiration is removed
      workflow_started_at: null,
      workflow_completed_at: null,
      workflow_step: null,
    };

    return await projectRepository.create(dataWithUserAndSecurity);
  },

  /**
   * Update project with business rules
   */
  async updateProject(
    id: string,
    updates: Partial<Project> & { require_password?: boolean }
  ): Promise<Project> {
    const existingProject = await this.getProjectById(id);

    // Handle password logic for updates
    const { require_password, ...dbUpdates } = updates;

    if (require_password !== undefined) {
      if (require_password && !existingProject.password_hash) {
        // Generate password if now required and doesn't exist
        dbUpdates.password_hash = this.generatePassword();
      } else if (!require_password && existingProject.password_hash) {
        // Remove password if no longer required
        dbUpdates.password_hash = "";
      }
    }

    // Business rule: can't change client once project is in progress
    if (
      dbUpdates.client_id &&
      dbUpdates.client_id !== existingProject.client_id &&
      existingProject.status !== "draft"
    ) {
      throw new Error("Cannot change client once project is in progress");
    }

    // Business rule: can't go back from completed to other statuses
    if (
      existingProject.status === "completed" &&
      dbUpdates.status &&
      dbUpdates.status !== "completed"
    ) {
      throw new Error("Cannot change status of completed project");
    }

    return await projectRepository.update(id, dbUpdates);
  },

  /**
   * Delete project with dependency checks
   */
  async deleteProject(id: string): Promise<void> {
    const project = await this.getProjectById(id);

    // Business rule: can't delete projects that are in progress or completed
    if (project.status !== "draft") {
      throw new Error("Cannot delete projects that are not in draft status");
    }

    // TODO: Check for dependencies (galleries, moodboards, etc.)
    // This would typically check other tables

    await projectRepository.delete(id);
  },

  /**
   * Search projects with enhanced logic
   */
  async searchProjects(
    query: string,
    status?: "draft" | "in_progress" | "completed",
    clientId?: string
  ): Promise<ProjectWithClient[]> {
    if (!query?.trim()) {
      return [];
    }

    const filters: IProjectFilters = {
      search: query.trim(),
      status,
      client_id: clientId,
    };

    const pagination: IPagination = { page: 1, pageSize: 50 };

    return await this.getProjects(filters, pagination);
  },

  /**
   * Generate random password for project access
   */
  generatePassword(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";

    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  },

  /**
   * Get project status options for UI
   */
  getStatusOptions() {
    return [
      {
        value: "draft" as const,
        label: "Brouillon",
        description: "Projet en cours de préparation",
        icon: "i-lucide-file-text",
        color: "neutral",
      },
      {
        value: "in_progress" as const,
        label: "En cours",
        description: "Projet en cours de réalisation",
        icon: "i-lucide-play-circle",
        color: "info",
      },
      {
        value: "completed" as const,
        label: "Terminé",
        description: "Projet terminé",
        icon: "i-lucide-check-circle",
        color: "success",
      },
    ];
  },

  // Workflow methods
  /**
   * Start the onboarding workflow
   */
  async startWorkflow(id: string): Promise<Project> {
    const project = await this.getProjectById(id);

    if (project.workflow_started_at) {
      throw new Error("Workflow already started");
    }

    return await projectRepository.startWorkflow(id);
  },

  /**
   * Update workflow step
   */
  async updateWorkflowStep(id: string, step: WorkflowStep): Promise<Project> {
    const project = await this.getProjectById(id);

    if (!project.workflow_started_at) {
      throw new Error("Workflow not started");
    }

    if (step < 1 || step > 4) {
      throw new Error("Invalid workflow step");
    }

    return await projectRepository.updateWorkflowStep(id, step);
  },

  /**
   * Complete the workflow
   */
  async completeWorkflow(id: string): Promise<Project> {
    const project = await this.getProjectById(id);

    if (!project.workflow_started_at) {
      throw new Error("Workflow not started");
    }

    if (project.workflow_completed_at) {
      throw new Error("Workflow already completed");
    }

    return await projectRepository.completeWorkflow(id);
  },

  /**
   * Validate if project can proceed to next workflow step
   */
  validateWorkflowProgression(
    project: ProjectWithClient,
    targetStep: WorkflowStep
  ): WorkflowValidation {
    const currentStep = project.workflow_step || 1;
    const steps = [
      { step: 1, module: "proposal" as const },
      { step: 2, module: "moodboard" as const },
      { step: 3, module: "selection" as const },
      { step: 4, module: "gallery" as const },
    ];

    // Check if trying to go backwards (allowed for navigation, but not for workflow progression)
    if (targetStep < currentStep) {
      return {
        canProceedToNextStep: true, // Allow going backwards for navigation
        currentStepCompleted: false,
        previousStepsCompleted: false,
      };
    }

    // Check if trying to skip steps
    if (targetStep > currentStep + 1) {
      return {
        canProceedToNextStep: false,
        currentStepCompleted: false,
        previousStepsCompleted: false,
        errorMessage: "Impossible de sauter des étapes",
      };
    }

    // Check if current step is completed (only when advancing)
    if (targetStep > currentStep) {
      const currentStepInfo = steps.find((s) => s.step === currentStep);
      if (!currentStepInfo) {
        return {
          canProceedToNextStep: false,
          currentStepCompleted: false,
          previousStepsCompleted: false,
          errorMessage: "Étape invalide",
        };
      }

      const currentModule = project[currentStepInfo.module];
      const currentStepCompleted = currentModule?.status === "completed";

      if (!currentStepCompleted) {
        return {
          canProceedToNextStep: false,
          currentStepCompleted: false,
          previousStepsCompleted: true,
          errorMessage: `L'étape ${currentStep} doit être terminée avant de continuer`,
        };
      }
    }

    // Check if previous steps are completed (only when advancing)
    if (targetStep > currentStep) {
      const previousStepsCompleted = steps
        .filter((s) => s.step < currentStep)
        .every((s) => {
          const module = project[s.module];
          return module?.status === "completed";
        });

      if (!previousStepsCompleted) {
        return {
          canProceedToNextStep: false,
          currentStepCompleted: true,
          previousStepsCompleted: false,
          errorMessage: "Les étapes précédentes doivent être terminées",
        };
      }
    }

    return {
      canProceedToNextStep: true,
      currentStepCompleted: true,
      previousStepsCompleted: true,
    };
  },

  /**
   * Get workflow step info
   */
  getWorkflowStepInfo(
    project: ProjectWithClient,
    step: WorkflowStep
  ): WorkflowStepInfo {
    const steps = [
      {
        step: 1,
        module: "proposal" as const,
        title: "Proposition",
        description: "Devis et contrat",
      },
      {
        step: 2,
        module: "moodboard" as const,
        title: "Moodboard",
        description: "Inspiration visuelle",
      },
      {
        step: 3,
        module: "selection" as const,
        title: "Sélection",
        description: "Choix client",
      },
      {
        step: 4,
        module: "gallery" as const,
        title: "Galerie",
        description: "Livrable final",
      },
    ];

    const stepInfo = steps.find((s) => s.step === step);
    if (!stepInfo) {
      throw new Error("Invalid workflow step");
    }

    const currentStep = project.workflow_step || 1;
    const module = project[stepInfo.module];
    const isCompleted = module?.status === "completed";

    // Can edit if it's the current step or a future step
    const canEdit = step >= currentStep;

    // Can delete if it's the current step and not completed
    const canDelete = step === currentStep && !isCompleted;

    return {
      step,
      module: stepInfo.module,
      title: stepInfo.title,
      description: stepInfo.description,
      canEdit,
      canDelete,
      isCompleted,
    };
  },
};
