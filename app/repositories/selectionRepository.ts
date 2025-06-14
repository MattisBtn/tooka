import type {
  IPagination,
  ISelectionFilters,
  ISelectionRepository,
  Selection,
} from "~/types/selection";

export const selectionRepository: ISelectionRepository = {
  async findMany(
    filters: ISelectionFilters,
    pagination: IPagination
  ): Promise<Selection[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder aux sélections");
    }

    let query = supabase
      .from("selections")
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
      // For selections, we can search by project title
      query = query.or(`project.title.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch selections: ${error.message}`);
    }

    return data || [];
  },

  async findById(id: string): Promise<Selection | null> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error(
        "Vous devez être connecté pour accéder à cette sélection"
      );
    }

    const { data, error } = await supabase
      .from("selections")
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
      throw new Error(`Failed to fetch selection: ${error.message}`);
    }

    return data;
  },

  async findByProjectId(projectId: string): Promise<Selection | null> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error(
        "Vous devez être connecté pour accéder à cette sélection"
      );
    }

    const { data, error } = await supabase
      .from("selections")
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
      throw new Error(`Failed to fetch selection: ${error.message}`);
    }

    return data;
  },

  async create(
    selectionData: Omit<Selection, "id" | "created_at" | "updated_at">
  ): Promise<Selection> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("selections")
      .insert(selectionData)
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
      throw new Error(`Failed to create selection: ${error.message}`);
    }

    return data;
  },

  async update(
    id: string,
    selectionData: Partial<Selection>
  ): Promise<Selection> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour modifier cette sélection");
    }

    // First verify the selection belongs to the user
    const existingSelection = await supabase
      .from("selections")
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

    if (existingSelection.error) {
      throw new Error("Sélection non trouvée ou accès non autorisé");
    }

    const { data, error } = await supabase
      .from("selections")
      .update(selectionData)
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
      throw new Error(`Failed to update selection: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error(
        "Vous devez être connecté pour supprimer cette sélection"
      );
    }

    // First verify the selection belongs to the user
    const existingSelection = await supabase
      .from("selections")
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

    if (existingSelection.error) {
      throw new Error("Sélection non trouvée ou accès non autorisé");
    }

    const { error } = await supabase.from("selections").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete selection: ${error.message}`);
    }
  },
};
