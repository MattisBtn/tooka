import type {
  IMoodboardFilters,
  IMoodboardRepository,
  IPagination,
  Moodboard,
} from "~/types/moodboard";

export const moodboardRepository: IMoodboardRepository = {
  async findMany(
    filters: IMoodboardFilters,
    pagination: IPagination
  ): Promise<Moodboard[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder aux moodboards");
    }

    let query = supabase
      .from("moodboards")
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
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch moodboards: ${error.message}`);
    }

    return data || [];
  },

  async findById(id: string): Promise<Moodboard | null> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder à ce moodboard");
    }

    const { data, error } = await supabase
      .from("moodboards")
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
      throw new Error(`Failed to fetch moodboard: ${error.message}`);
    }

    return data;
  },

  async findByProjectId(projectId: string): Promise<Moodboard | null> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder à ce moodboard");
    }

    const { data, error } = await supabase
      .from("moodboards")
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
      throw new Error(`Failed to fetch moodboard: ${error.message}`);
    }

    return data;
  },

  async create(
    moodboardData: Omit<Moodboard, "id" | "created_at" | "updated_at">
  ): Promise<Moodboard> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("moodboards")
      .insert(moodboardData)
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
      throw new Error(`Failed to create moodboard: ${error.message}`);
    }

    return data;
  },

  async update(
    id: string,
    moodboardData: Partial<Moodboard>
  ): Promise<Moodboard> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour modifier ce moodboard");
    }

    // First verify the moodboard belongs to the user
    const existingMoodboard = await supabase
      .from("moodboards")
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

    if (existingMoodboard.error) {
      throw new Error("Moodboard non trouvé ou accès non autorisé");
    }

    const { data, error } = await supabase
      .from("moodboards")
      .update(moodboardData)
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
      throw new Error(`Failed to update moodboard: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer ce moodboard");
    }

    // First verify the moodboard belongs to the user
    const existingMoodboard = await supabase
      .from("moodboards")
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

    if (existingMoodboard.error) {
      throw new Error("Moodboard non trouvé ou accès non autorisé");
    }

    const { error } = await supabase.from("moodboards").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete moodboard: ${error.message}`);
    }
  },
};
