import type { IMoodboardRepository, Moodboard } from "~/types/moodboard";

export const moodboardRepository: IMoodboardRepository = {
  async findById(id: string): Promise<Moodboard | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("moodboards")
      .select(
        `
        *,
        project:projects(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch moodboard: ${error.message}`);
    }

    return data;
  },

  async findByProjectId(projectId: string): Promise<Moodboard | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("moodboards")
      .select(
        `
        *,
        project:projects(*),
        moodboard_images(*)
      `
      )
      .eq("project_id", projectId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to fetch moodboard with images: ${error.message}`
      );
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
        project:projects(*)
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

    const { data, error } = await supabase
      .from("moodboards")
      .update(moodboardData)
      .eq("id", id)
      .select(
        `
        *,
        project:projects(*),
        moodboard_images(*)
      `
      )
      .single();

    if (error) {
      throw new Error(
        `Failed to update moodboard with images: ${error.message}`
      );
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = useSupabaseClient();

    const { error } = await supabase.from("moodboards").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete moodboard: ${error.message}`);
    }
  },
};
