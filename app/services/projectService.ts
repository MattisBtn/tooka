import { projectRepository } from "~/repositories/projectRepository";
import type {
  IPagination,
  IProjectFilters,
  Project,
  ProjectWithClient,
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
};
