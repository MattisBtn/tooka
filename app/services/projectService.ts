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
   * Create new project with validation and secure link generation
   */
  async createProject(
    projectData: Omit<
      Project,
      | "id"
      | "created_at"
      | "updated_at"
      | "user_id"
      | "secure_link"
      | "password_hash"
    >
  ): Promise<ProjectWithClient> {
    // Get current user from Supabase
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour créer un projet");
    }

    if (!projectData.client_id?.trim()) {
      throw new Error("Client is required");
    }

    // Generate secure link and password hash
    const secureLink = this.generateSecureLink();
    const passwordHash = await this.hashPassword(
      projectData.title + Date.now()
    );

    // Add user_id and generated fields
    const dataWithUserAndSecurity = {
      ...projectData,
      user_id: user.value.id,
      secure_link: secureLink,
      password_hash: passwordHash,
    };

    return await projectRepository.create(dataWithUserAndSecurity);
  },

  /**
   * Update project with business rules
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const existingProject = await this.getProjectById(id);

    // Business rule: can't change client once project is in progress
    if (
      updates.client_id &&
      updates.client_id !== existingProject.client_id &&
      existingProject.status !== "draft"
    ) {
      throw new Error("Cannot change client once project is in progress");
    }

    // Business rule: can't go back from completed to other statuses
    if (
      existingProject.status === "completed" &&
      updates.status &&
      updates.status !== "completed"
    ) {
      throw new Error("Cannot change status of completed project");
    }

    return await projectRepository.update(id, updates);
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
   * Generate a secure link for project access
   */
  generateSecureLink(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Hash password for project access
   */
  async hashPassword(password: string): Promise<string> {
    // Simple hash for demo - in production use proper hashing like bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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
