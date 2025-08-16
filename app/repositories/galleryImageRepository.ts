import type { GalleryImage, IGalleryImageRepository } from "~/types/gallery";

export const galleryImageRepository: IGalleryImageRepository = {
  async findByGalleryId(galleryId: string): Promise<GalleryImage[]> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("gallery_id", galleryId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch gallery images: ${error.message}`);
    }

    return data || [];
  },

  async create(
    imageData: Omit<GalleryImage, "id" | "created_at">
  ): Promise<GalleryImage> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("gallery_images")
      .insert(imageData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create gallery image: ${error.message}`);
    }

    return data;
  },

  async update(
    id: string,
    imageData: Partial<GalleryImage>
  ): Promise<GalleryImage> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("gallery_images")
      .update(imageData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update gallery image: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = useSupabaseClient();

    const { error } = await supabase
      .from("gallery_images")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete gallery image: ${error.message}`);
    }
  },

  /**
   * Get public URL for gallery image (since bucket is public)
   */
  getPublicUrl(filePath: string): string {
    const supabase = useSupabaseClient();

    const { data } = supabase.storage
      .from("gallery-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};
