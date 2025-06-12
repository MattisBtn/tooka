import type {
  IMoodboardImageRepository,
  MoodboardImage,
} from "~/types/moodboard";

export const moodboardImageRepository: IMoodboardImageRepository = {
  async findByMoodboardId(moodboardId: string): Promise<MoodboardImage[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder aux images");
    }

    // Verify moodboard belongs to user through project relationship
    const { data, error } = await supabase
      .from("moodboard_images")
      .select(
        `
        *,
        moodboard:moodboards!inner(
          id,
          project:projects!inner(
            user_id
          )
        )
      `
      )
      .eq("moodboard_id", moodboardId)
      .eq("moodboard.project.user_id", user.value.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch moodboard images: ${error.message}`);
    }

    return data || [];
  },

  async create(
    imageData: Omit<MoodboardImage, "id" | "created_at">
  ): Promise<MoodboardImage> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour ajouter une image");
    }

    // Verify moodboard belongs to user
    const moodboardCheck = await supabase
      .from("moodboards")
      .select(
        `
        id,
        project:projects!inner(
          user_id
        )
      `
      )
      .eq("id", imageData.moodboard_id)
      .eq("project.user_id", user.value.id)
      .single();

    if (moodboardCheck.error) {
      throw new Error("Moodboard non trouvé ou accès non autorisé");
    }

    const { data, error } = await supabase
      .from("moodboard_images")
      .insert(imageData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create moodboard image: ${error.message}`);
    }

    return data;
  },

  async update(
    id: string,
    imageData: Partial<MoodboardImage>
  ): Promise<MoodboardImage> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour modifier cette image");
    }

    // Verify image belongs to user through moodboard->project relationship
    const existingImage = await supabase
      .from("moodboard_images")
      .select(
        `
        id,
        moodboard:moodboards!inner(
          project:projects!inner(
            user_id
          )
        )
      `
      )
      .eq("id", id)
      .eq("moodboard.project.user_id", user.value.id)
      .single();

    if (existingImage.error) {
      throw new Error("Image non trouvée ou accès non autorisé");
    }

    const { data, error } = await supabase
      .from("moodboard_images")
      .update(imageData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update moodboard image: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer cette image");
    }

    // Verify image belongs to user through moodboard->project relationship
    const existingImage = await supabase
      .from("moodboard_images")
      .select(
        `
        id,
        file_url,
        moodboard:moodboards!inner(
          project:projects!inner(
            user_id
          )
        )
      `
      )
      .eq("id", id)
      .eq("moodboard.project.user_id", user.value.id)
      .single();

    if (existingImage.error) {
      throw new Error("Image non trouvée ou accès non autorisé");
    }

    // Delete from database
    const { error } = await supabase
      .from("moodboard_images")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete moodboard image: ${error.message}`);
    }

    // Delete from storage
    try {
      await supabase.storage
        .from("moodboard-images")
        .remove([existingImage.data.file_url]);
    } catch (storageError) {
      console.warn("Failed to delete image from storage:", storageError);
      // Don't throw error for storage deletion failure
    }
  },

  async deleteMany(moodboardId: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer les images");
    }

    // Get all images for the moodboard
    const images = await this.findByMoodboardId(moodboardId);

    if (images.length === 0) return;

    // Delete from database
    const { error } = await supabase
      .from("moodboard_images")
      .delete()
      .eq("moodboard_id", moodboardId);

    if (error) {
      throw new Error(`Failed to delete moodboard images: ${error.message}`);
    }

    // Delete from storage
    try {
      const filePaths = images.map((img) => img.file_url);
      await supabase.storage.from("moodboard-images").remove(filePaths);
    } catch (storageError) {
      console.warn("Failed to delete images from storage:", storageError);
      // Don't throw error for storage deletion failure
    }
  },

  /**
   * Get public URL for moodboard image (since bucket is public)
   */
  getPublicUrl(filePath: string): string {
    const supabase = useSupabaseClient();

    const { data } = supabase.storage
      .from("moodboard-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};
