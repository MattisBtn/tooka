import type {
  ISelectionImageRepository,
  SelectionImage,
} from "~/types/selection";

export const selectionImageRepository: ISelectionImageRepository = {
  async findBySelectionId(selectionId: string): Promise<SelectionImage[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder aux images");
    }

    // Verify selection belongs to user through project relationship
    const { data, error } = await supabase
      .from("selection_images")
      .select(
        `
        *,
        selection:selections!inner(
          id,
          project:projects!inner(
            user_id
          )
        )
      `
      )
      .eq("selection_id", selectionId)
      .eq("selection.project.user_id", user.value.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch selection images: ${error.message}`);
    }

    return data || [];
  },

  async create(
    imageData: Omit<SelectionImage, "id" | "created_at">
  ): Promise<SelectionImage> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour ajouter une image");
    }

    // Verify selection belongs to user
    const selectionCheck = await supabase
      .from("selections")
      .select(
        `
        id,
        project:projects!inner(
          user_id
        )
      `
      )
      .eq("id", imageData.selection_id)
      .eq("project.user_id", user.value.id)
      .single();

    if (selectionCheck.error) {
      throw new Error("Sélection non trouvée ou accès non autorisé");
    }

    const { data, error } = await supabase
      .from("selection_images")
      .insert(imageData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create selection image: ${error.message}`);
    }

    return data;
  },

  async update(
    id: string,
    imageData: Partial<SelectionImage>
  ): Promise<SelectionImage> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour modifier cette image");
    }

    // Verify image belongs to user through selection->project relationship
    const existingImage = await supabase
      .from("selection_images")
      .select(
        `
        id,
        selection:selections!inner(
          project:projects!inner(
            user_id
          )
        )
      `
      )
      .eq("id", id)
      .eq("selection.project.user_id", user.value.id)
      .single();

    if (existingImage.error) {
      throw new Error("Image non trouvée ou accès non autorisé");
    }

    const { data, error } = await supabase
      .from("selection_images")
      .update(imageData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update selection image: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer cette image");
    }

    // Verify image belongs to user through selection->project relationship
    const existingImage = await supabase
      .from("selection_images")
      .select(
        `
        id,
        file_url,
        selection:selections!inner(
          project:projects!inner(
            user_id
          )
        )
      `
      )
      .eq("id", id)
      .eq("selection.project.user_id", user.value.id)
      .single();

    if (existingImage.error) {
      throw new Error("Image non trouvée ou accès non autorisé");
    }

    // Delete from database
    const { error } = await supabase
      .from("selection_images")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete selection image: ${error.message}`);
    }

    // Delete from storage
    try {
      await supabase.storage
        .from("selection-images")
        .remove([existingImage.data.file_url]);
    } catch (storageError) {
      console.warn("Failed to delete image from storage:", storageError);
      // Don't throw error for storage deletion failure
    }
  },

  async deleteMany(selectionId: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer les images");
    }

    // Get all images for the selection
    const images = await this.findBySelectionId(selectionId);

    if (images.length === 0) return;

    // Delete from database
    const { error } = await supabase
      .from("selection_images")
      .delete()
      .eq("selection_id", selectionId);

    if (error) {
      throw new Error(`Failed to delete selection images: ${error.message}`);
    }

    // Delete from storage
    try {
      const filePaths = images.map((img) => img.file_url);
      await supabase.storage.from("selection-images").remove(filePaths);
    } catch (storageError) {
      console.warn("Failed to delete images from storage:", storageError);
      // Don't throw error for storage deletion failure
    }
  },

  /**
   * Get public URL for selection image (since bucket is public)
   */
  getPublicUrl(filePath: string): string {
    const supabase = useSupabaseClient();

    const { data } = supabase.storage
      .from("selection-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};
