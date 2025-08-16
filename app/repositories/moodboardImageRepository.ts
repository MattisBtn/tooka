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

    const { error } = await supabase
      .from("moodboard_images")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete moodboard image: ${error.message}`);
    }
  },

  async deleteMany(moodboardId: string): Promise<void> {
    const supabase = useSupabaseClient();

    // Delete from database
    const { error } = await supabase
      .from("moodboard_images")
      .delete()
      .eq("moodboard_id", moodboardId);

    if (error) {
      throw new Error(`Failed to delete moodboard images: ${error.message}`);
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
