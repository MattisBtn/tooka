import type {
  IMoodboardImageRepository,
  MoodboardImage,
} from "~/types/moodboard";

export const moodboardImageRepository: IMoodboardImageRepository = {
  async findByMoodboardId(moodboardId: string): Promise<MoodboardImage[]> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("moodboard_images")
      .select("*")
      .eq("moodboard_id", moodboardId)
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

    // Get file URL before deletion for storage cleanup
    const { data: imageData, error: fetchError } = await supabase
      .from("moodboard_images")
      .select("file_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw new Error(
        `Failed to fetch image for deletion: ${fetchError.message}`
      );
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
    if (imageData?.file_url) {
      try {
        await supabase.storage
          .from("moodboard-images")
          .remove([imageData.file_url]);
      } catch (storageError) {
        console.warn("Failed to delete image from storage:", storageError);
        // Don't throw error for storage deletion failure
      }
    }
  },

  async deleteMany(moodboardId: string): Promise<void> {
    const supabase = useSupabaseClient();

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
