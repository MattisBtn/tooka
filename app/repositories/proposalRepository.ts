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

    let query = supabase
      .from("proposals")
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

    const { data, error } = await supabase
      .from("proposals")
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
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch proposal: ${error.message}`);
    }

    return data;
  },

  async findByProjectId(projectId: string): Promise<Proposal | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("proposals")
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
      .eq("project_id", projectId)
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

    const { error } = await supabase.from("proposals").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete proposal: ${error.message}`);
    }
  },
};
