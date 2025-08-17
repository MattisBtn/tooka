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
   * Get project by ID with proposal data in a single query
   */
  async getProjectWithProposal(projectId: string): Promise<{
    project: {
      id: string;
      title: string;
      status: "draft" | "in_progress" | "completed";
      payment_method: "stripe" | "bank_transfer" | null;
      bank_iban: string | null;
      bank_bic: string | null;
      bank_beneficiary: string | null;
      initial_price: number | null;
      remaining_amount: number | null;
    } | null;
    proposal: {
      id: string;
      price: number;
      deposit_required: boolean;
      deposit_amount: number | null;
    } | null;
  } | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        status,
        payment_method,
        bank_iban,
        bank_bic,
        bank_beneficiary,
        initial_price,
        remaining_amount,
        proposals(
          id,
          price,
          deposit_required,
          deposit_amount
        )
      `
      )
      .eq("id", projectId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to fetch project with proposal: ${error.message}`
      );
    }

    if (!data) {
      return null;
    }

    // Extract proposal from the nested data
    const proposal = data.proposals?.[0] || null;

    return {
      project: data,
      proposal: proposal,
    };
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
   * Update project status to in_progress if needed (optimized version)
   */
  async updateProjectStatusIfNeeded(
    projectId: string,
    currentProject: ProjectWithClient
  ): Promise<string | null> {
    const supabase = useSupabaseClient();

    // Check if status should be updated to completed first
    if (this.shouldUpdateProjectToCompleted(currentProject)) {
      const { error } = await supabase
        .from("projects")
        .update({ status: "completed" })
        .eq("id", projectId);

      if (error) {
        throw new Error(`Failed to update project status: ${error.message}`);
      }
      return "completed";
    }

    // Check if status should be updated to in_progress
    if (
      currentProject.status === "draft" &&
      this.shouldUpdateProjectStatus(currentProject)
    ) {
      const { error } = await supabase
        .from("projects")
        .update({ status: "in_progress" })
        .eq("id", projectId);

      if (error) {
        throw new Error(`Failed to update project status: ${error.message}`);
      }
      return "in_progress";
    }

    return null; // No status change needed
  },
};
