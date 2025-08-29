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

    // Build base query for counting
    let countQuery = supabase
      .from("projects")
      .select("*", { count: "exact", head: true });

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
        ),
        proposal:proposals!project_id(
          id,
          status
        ),
        moodboard:moodboards!project_id(
          id,
          status
        ),
        selection:selections!project_id(
          id,
          status
        ),
        gallery:galleries!project_id(
          id,
          status
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

    // Process the data to extract single items from arrays (since relations return arrays)
    const processedData =
      data?.map((project) => ({
        ...project,
        proposal: Array.isArray(project.proposal)
          ? project.proposal[0] || null
          : project.proposal,
        moodboard: Array.isArray(project.moodboard)
          ? project.moodboard[0] || null
          : project.moodboard,
        selection: Array.isArray(project.selection)
          ? project.selection[0] || null
          : project.selection,
        gallery: Array.isArray(project.gallery)
          ? project.gallery[0] || null
          : project.gallery,
      })) || [];

    return {
      data: processedData as ProjectWithClient[],
      total: count || 0,
    };
  },

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<ProjectWithClient> {
    const supabase = useSupabaseClient();

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
          status,
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
          selection_id,
          created_at,
          updated_at
        )
      `
      )
      .eq("id", id)
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
      | "initial_price"
      | "id"
      | "created_at"
      | "updated_at"
      | "user_id"
      | "password_hash"
      | "password_expires_at"
    > & { require_password?: boolean }
  ): Promise<ProjectWithClient> {
    const supabase = useSupabaseClient();
    const user = useUserStore();

    const { require_password, ...dbProjectData } = projectData;
    const passwordHash = require_password
      ? projectService.generatePassword()
      : "";

    // RLS handles user_id automatically, so we can omit it from the insert
    const { data, error } = await supabase
      .from("projects")
      .insert({
        ...dbProjectData,
        password_hash: passwordHash,
        user_id: user.user.auth?.id || "",
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

    const { error } = await supabase.from("projects").delete().eq("id", id);

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
   * Determine project status based on modules
   */
  determineProjectStatus(modules: {
    proposal?: { status?: string } | null;
    moodboard?: { status?: string } | null;
    selection?: { status?: string } | null;
    gallery?: { status?: string } | null;
  }): "draft" | "in_progress" | "completed" {
    // If gallery is completed, project is completed
    if (modules.gallery?.status === "completed") {
      return "completed";
    }

    // If any module is not draft, project is in progress
    const hasNonDraftModule = [
      modules.proposal?.status,
      modules.moodboard?.status,
      modules.selection?.status,
      modules.gallery?.status,
    ].some((status) => status && status !== "draft");

    return hasNonDraftModule ? "in_progress" : "draft";
  },

  /**
   * Update project status
   */
  async updateProjectStatus(
    projectId: string,
    status: "draft" | "in_progress" | "completed"
  ): Promise<void> {
    const supabase = useSupabaseClient();

    const { error } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", projectId);

    if (error) {
      throw new Error(`Failed to update project status: ${error.message}`);
    }
  },

  /**
   * Calculate workflow status for a project
   */
  getProjectWorkflowStatus(project: {
    proposal?: { status?: string } | null;
    moodboard?: { status?: string } | null;
    selection?: { status?: string } | null;
    gallery?: { status?: string } | null;
  }): import("~/types/project").ProjectWorkflowStatus {
    const stages: import("~/types/project").WorkflowStage[] = [
      {
        name: "Proposition",
        key: "proposal",
        status: this.getStageStatus(project.proposal?.status),
        icon: "i-lucide-file-text",
        color: this.getStageColor(
          this.getStageStatus(project.proposal?.status)
        ),
      },
      {
        name: "Moodboard",
        key: "moodboard",
        status: this.getStageStatus(project.moodboard?.status),
        icon: "i-lucide-image",
        color: this.getStageColor(
          this.getStageStatus(project.moodboard?.status)
        ),
      },
      {
        name: "Sélection",
        key: "selection",
        status: this.getStageStatus(project.selection?.status),
        icon: "i-lucide-check-square",
        color: this.getStageColor(
          this.getStageStatus(project.selection?.status)
        ),
      },
      {
        name: "Galerie",
        key: "gallery",
        status: this.getStageStatus(project.gallery?.status),
        icon: "i-lucide-images",
        color: this.getStageColor(this.getStageStatus(project.gallery?.status)),
      },
    ];

    // Find current stage (first non-completed stage or last completed)
    const currentStage =
      stages.find((stage) => stage.status === "in_progress") ||
      stages.filter((stage) => stage.status === "completed").pop() ||
      stages[0] ||
      null;

    // Calculate overall progress
    const completedStages = stages.filter(
      (stage) => stage.status === "completed"
    ).length;
    const overallProgress = (completedStages / stages.length) * 100;

    return {
      currentStage,
      stages,
      overallProgress,
    };
  },

  /**
   * Get stage status based on module status
   */
  getStageStatus(
    moduleStatus?: string
  ): import("~/types/project").WorkflowStageStatus {
    if (!moduleStatus || moduleStatus === "draft") return "not_started";
    if (moduleStatus === "completed") return "completed";
    return "in_progress";
  },

  /**
   * Get color for stage status
   */
  getStageColor(status: import("~/types/project").WorkflowStageStatus): string {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "info";
      case "not_started":
        return "neutral";
      default:
        return "neutral";
    }
  },
};
