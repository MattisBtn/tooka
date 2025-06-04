import type {
  IPagination,
  IProjectFilters,
  IProjectRepository,
  Project,
  ProjectWithClient,
} from "~/types/project";

export const projectRepository: IProjectRepository = {
  async findMany(
    filters: IProjectFilters,
    pagination: IPagination
  ): Promise<ProjectWithClient[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder aux projets");
    }

    let query = supabase
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
        proposal:proposals(
          id,
          title,
          status,
          price,
          deposit_required,
          deposit_amount,
          contract_url,
          quote_url
        ),
        gallery:galleries(
          id,
          status,
          payment_required,
          selection_id,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", user.value.id)
      .order("created_at", { ascending: false })
      .range(
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
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    // Transform the data to handle the proposal array (Supabase returns arrays for relations)
    const transformedData = (data || []).map((project) => ({
      ...project,
      proposal:
        Array.isArray(project.proposal) && project.proposal.length > 0
          ? project.proposal[0]
          : null,
      gallery:
        Array.isArray(project.gallery) && project.gallery.length > 0
          ? project.gallery[0]
          : null,
    }));

    return transformedData;
  },

  async findById(id: string): Promise<ProjectWithClient | null> {
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
        proposal:proposals(
          id,
          title,
          status,
          price,
          deposit_required,
          deposit_amount,
          contract_url,
          quote_url
        ),
        gallery:galleries(
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
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    // Transform the data to handle the proposal and gallery arrays (Supabase returns arrays for relations)
    const transformedData = {
      ...data,
      proposal:
        Array.isArray(data.proposal) && data.proposal.length > 0
          ? data.proposal[0]
          : null,
      gallery:
        Array.isArray(data.gallery) && data.gallery.length > 0
          ? data.gallery[0]
          : null,
    };

    return transformedData;
  },

  async create(
    projectData: Omit<Project, "id" | "created_at" | "updated_at">
  ): Promise<ProjectWithClient> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("projects")
      .insert(projectData)
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

    return data;
  },

  async update(id: string, projectData: Partial<Project>): Promise<Project> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour modifier ce projet");
    }

    const { data, error } = await supabase
      .from("projects")
      .update(projectData)
      .eq("id", id)
      .eq("user_id", user.value.id)
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
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
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
};
