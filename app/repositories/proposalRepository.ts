import type { Proposal, ProposalStatus } from "~/types/proposal";

export const proposalRepository = {
  async findMany(
    filters: {
      search?: string;
      status?: ProposalStatus | null;
      project_id?: string;
    },
    pagination: { page: number; pageSize: number }
  ): Promise<Proposal[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder aux propositions");
    }

    let query = supabase
      .from("proposals")
      .select(
        `
        *,
        project:projects!inner(
          id,
          title,
          status,
          user_id
        )
      `
      )
      .eq("project.user_id", user.value.id)
      .order("created_at", { ascending: false })
      .range(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize - 1
      );

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.project_id) {
      query = query.eq("project_id", filters.project_id);
    }

    if (filters.search) {
      query = query.or(`content_html.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch proposals: ${error.message}`);
    }

    return data || [];
  },

  async findById(id: string): Promise<Proposal | null> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error(
        "Vous devez être connecté pour accéder à cette proposition"
      );
    }

    const { data, error } = await supabase
      .from("proposals")
      .select(
        `
        *,
        project:projects!inner(
          id,
          title,
          status,
          user_id
        )
      `
      )
      .eq("id", id)
      .eq("project.user_id", user.value.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch proposal: ${error.message}`);
    }

    return data;
  },

  async findByProjectId(projectId: string): Promise<Proposal | null> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error(
        "Vous devez être connecté pour accéder à cette proposition"
      );
    }

    const { data, error } = await supabase
      .from("proposals")
      .select(
        `
        *,
        project:projects!inner(
          id,
          title,
          status,
          user_id
        )
      `
      )
      .eq("project_id", projectId)
      .eq("project.user_id", user.value.id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch proposal: ${error.message}`);
    }

    return data;
  },

  async create(
    proposalData: Omit<Proposal, "id" | "created_at" | "updated_at">
  ): Promise<Proposal> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("proposals")
      .insert(proposalData)
      .select(
        `
        *,
        project:projects(
          id,
          title,
          status
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create proposal: ${error.message}`);
    }

    return data;
  },

  async update(id: string, proposalData: Partial<Proposal>): Promise<Proposal> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error(
        "Vous devez être connecté pour modifier cette proposition"
      );
    }

    // First verify the proposal belongs to the user
    const existingProposal = await supabase
      .from("proposals")
      .select(
        `
        id,
        project:projects!inner(
          user_id
        )
      `
      )
      .eq("id", id)
      .eq("project.user_id", user.value.id)
      .single();

    if (existingProposal.error) {
      throw new Error("Proposition non trouvée ou accès non autorisé");
    }

    // Ensure updated_at is set
    const updateData = {
      ...proposalData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("proposals")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        project:projects(
          id,
          title,
          status
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to update proposal: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error(
        "Vous devez être connecté pour supprimer cette proposition"
      );
    }

    // First verify the proposal belongs to the user
    const existingProposal = await supabase
      .from("proposals")
      .select(
        `
        id,
        project:projects!inner(
          user_id
        )
      `
      )
      .eq("id", id)
      .eq("project.user_id", user.value.id)
      .single();

    if (existingProposal.error) {
      throw new Error("Proposition non trouvée ou accès non autorisé");
    }

    const { error } = await supabase.from("proposals").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete proposal: ${error.message}`);
    }
  },
};
