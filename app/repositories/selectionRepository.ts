import type {
  ISelectionRepository,
  Selection,
  SelectionImage,
} from "~/types/selection";

export const selectionRepository: ISelectionRepository = {
  async findById(id: string): Promise<Selection | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("selections")
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
      throw new Error(`Failed to fetch selection: ${error.message}`);
    }

    return data;
  },

  async findByProjectId(projectId: string): Promise<{
    selection: Selection | null;
    images: SelectionImage[];
  }> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("selections")
      .select(
        `
        *,
        project:projects(*),
        selection_images(*)
      `
      )
      .eq("project_id", projectId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to fetch selection with images: ${error.message}`
      );
    }

    if (!data) {
      return { selection: null, images: [] };
    }

    const { selection_images, ...selection } = data;
    return {
      selection,
      images: selection_images || [],
    };
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
        project:projects(*)
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

    const { data, error } = await supabase
      .from("selections")
      .update(selectionData)
      .eq("id", id)
      .select(
        `
        *,
        project:projects(*)
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

    const { error } = await supabase.from("selections").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete selection: ${error.message}`);
    }
  },
};
