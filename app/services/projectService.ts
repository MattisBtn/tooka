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
  ): Promise<{ data: ProjectWithClient[]; total: number }> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder aux projets");
    }

    // Build base query for counting
    let countQuery = supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.value.id);

    // Apply filters to count query
    if (filters.status) {
      countQuery = countQuery.eq("status", filters.status);
    }

    if (filters.client_id) {
      countQuery = countQuery.eq("client_id", filters.client_id);
    }

    if (filters.search) {
      const { data: matchingClients } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.value.id)
        .or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,billing_email.ilike.%${filters.search}%`
        );

      const clientIds = matchingClients?.map((c) => c.id) || [];

      if (clientIds.length > 0) {
        countQuery = countQuery.or(
          `title.ilike.%${filters.search}%,description.ilike.%${
            filters.search
          }%,client_id.in.(${clientIds.join(",")})`
        );
      } else {
        countQuery = countQuery.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }
    }

    // Get total count
    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Failed to count projects: ${countError.message}`);
    }

    // Build query for data
    let query = supabase.from("projects").select(
      `
        *,
        client:clients(
          id,
          type,
          first_name,
          last_name,
          company_name,
          billing_email
        )
      `
    );

    // Apply sorting
    if (filters.sort) {
      switch (filters.sort) {
        case "created_desc":
          query = query.order("created_at", { ascending: false });
          break;
        case "created_asc":
          query = query.order("created_at", { ascending: true });
          break;
        case "title_asc":
          query = query.order("title", { ascending: true });
          break;
        case "title_desc":
          query = query.order("title", { ascending: false });
          break;
        case "status_asc":
          query = query.order("status", { ascending: true });
          break;
        case "status_desc":
          query = query.order("status", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    query = query.range(
      (pagination.page - 1) * pagination.pageSize,
      pagination.page * pagination.pageSize - 1
    );

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.client_id) {
      query = query.eq("client_id", filters.client_id);
    }

    if (filters.search) {
      const { data: matchingClients } = await supabase
        .from("clients")
        .select("id")
        .or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,billing_email.ilike.%${filters.search}%`
        );

      const clientIds = matchingClients?.map((c) => c.id) || [];

      if (clientIds.length > 0) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${
            filters.search
          }%,client_id.in.(${clientIds.join(",")})`
        );
      } else {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return {
      data: data as ProjectWithClient[],
      total: count || 0,
    };
  },

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<ProjectWithClient> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder à ce projet");
    }

    const { data, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        client:clients(
          id,
          type,
          first_name,
          last_name,
          company_name,
          billing_email
        ),
        proposal:proposals!project_id(
          id,
          content_json,
          content_html,
          status,
          price,
          deposit_required,
          deposit_amount,
          contract_url,
          quote_url
        ),
        moodboard:moodboards!project_id(
          id,
          title,
          description,
          status,
          created_at,
          updated_at
        ),
        selection:selections!project_id(
          id,
          max_media_selection,
          extra_media_price,
          status,
          created_at,
          updated_at
        ),
        gallery:galleries!project_id(
          id,
          status,
          payment_required,
          selection_id,
          created_at,
          updated_at
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.value.id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    // Extract single items from arrays (since relations return arrays)
    const processedData = {
      ...data,
      proposal: Array.isArray(data.proposal)
        ? data.proposal[0] || null
        : data.proposal,
      moodboard: Array.isArray(data.moodboard)
        ? data.moodboard[0] || null
        : data.moodboard,
      selection: Array.isArray(data.selection)
        ? data.selection[0] || null
        : data.selection,
      gallery: Array.isArray(data.gallery)
        ? data.gallery[0] || null
        : data.gallery,
    } as ProjectWithClient;

    return processedData;
  },

  /**
   * Create new project
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
    > & { require_password?: boolean }
  ): Promise<ProjectWithClient> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour créer un projet");
    }

    const { require_password, ...dbProjectData } = projectData;
    const passwordHash = require_password
      ? projectService.generatePassword()
      : "";

    const { data, error } = await supabase
      .from("projects")
      .insert({
        ...dbProjectData,
        user_id: user.value.id,
        password_hash: passwordHash,
      })
      .select(
        `
        *,
        client:clients(
          id,
          type,
          first_name,
          last_name,
          company_name,
          billing_email
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return data as ProjectWithClient;
  },

  /**
   * Generate random password for project access
   */
  generatePassword(): string {
    const chars = "0123456789";
    let password = "";

    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  },

  /**
   * Update project
   */
  async updateProject(
    id: string,
    updates: Partial<Project> & { require_password?: boolean }
  ): Promise<Project> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour modifier ce projet");
    }

    // Extract require_password from updates as it's not a database column
    const { require_password, ...dbUpdates } = updates;

    // Handle password generation/removal based on require_password
    if (require_password !== undefined) {
      if (require_password) {
        // Generate new password if required and not already set
        dbUpdates.password_hash = projectService.generatePassword();
      } else {
        // Remove password if not required
        dbUpdates.password_hash = "";
      }
    }

    const { data, error } = await supabase
      .from("projects")
      .update(dbUpdates)
      .eq("id", id)
      .eq("user_id", user.value.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer ce projet");
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.value.id);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  },

  /**
   * Delete multiple projects with dependency checks
   */
  async deleteMultipleProjects(
    ids: string[]
  ): Promise<{ success: string[]; failed: string[]; errors: string[] }> {
    if (!ids.length) {
      return { success: [], failed: [], errors: [] };
    }

    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer ces projets");
    }

    const results = {
      success: [] as string[],
      failed: [] as string[],
      errors: [] as string[],
    };

    // Delete projects one by one to handle individual errors
    for (const id of ids) {
      try {
        await this.deleteProject(id);
        results.success.push(id);
      } catch (error) {
        results.failed.push(id);
        results.errors.push(
          error instanceof Error ? error.message : "Erreur inconnue"
        );
      }
    }

    return results;
  },

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

  /**
   * Check if project should be updated to in_progress status
   */
  shouldUpdateProjectStatus(project: ProjectWithClient): boolean {
    if (project.status === "completed") {
      return false;
    }

    // Check if any module is not in draft status
    return !!(
      (project.proposal && project.proposal.status !== "draft") ||
      (project.moodboard && project.moodboard.status !== "draft") ||
      (project.selection && project.selection.status !== "draft") ||
      (project.gallery && project.gallery.status !== "draft")
    );
  },

  /**
   * Check if project should be updated to completed status
   */
  shouldUpdateProjectToCompleted(project: ProjectWithClient): boolean {
    if (project.status === "completed") {
      return false;
    }

    // Project is completed when gallery is completed
    return !!(project.gallery && project.gallery.status === "completed");
  },

  /**
   * Update project status to in_progress if needed
   */
  async updateProjectStatusIfNeeded(projectId: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour modifier ce projet");
    }

    // Get current project data
    const project = await this.getProjectById(projectId);

    // Check if status should be updated to completed first
    if (this.shouldUpdateProjectToCompleted(project)) {
      const { error } = await supabase
        .from("projects")
        .update({ status: "completed" })
        .eq("id", projectId)
        .eq("user_id", user.value.id);

      if (error) {
        throw new Error(`Failed to update project status: ${error.message}`);
      }
      return;
    }

    // Check if status should be updated to in_progress
    if (this.shouldUpdateProjectStatus(project)) {
      const { error } = await supabase
        .from("projects")
        .update({ status: "in_progress" })
        .eq("id", projectId)
        .eq("user_id", user.value.id);

      if (error) {
        throw new Error(`Failed to update project status: ${error.message}`);
      }
    }
  },
};
