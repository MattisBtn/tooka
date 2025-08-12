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

    // Get file URL before deletion for storage cleanup
    const { data: imageData, error: fetchError } = await supabase
      .from("gallery_images")
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
      .from("gallery_images")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete gallery image: ${error.message}`);
    }

    // Delete from storage
    if (imageData?.file_url) {
      try {
        await supabase.storage
          .from("gallery-images")
          .remove([imageData.file_url]);
      } catch (storageError) {
        console.warn("Failed to delete image from storage:", storageError);
        // Don't throw error for storage deletion failure
      }
    }
  },

  async deleteMany(galleryId: string): Promise<void> {
    const supabase = useSupabaseClient();

    // Get all images for the gallery
    const images = await this.findByGalleryId(galleryId);

    if (images.length === 0) return;

    // Delete from database
    const { error } = await supabase
      .from("gallery_images")
      .delete()
      .eq("gallery_id", galleryId);

    if (error) {
      throw new Error(`Failed to delete gallery images: ${error.message}`);
    }

    // Delete from storage
    try {
      const filePaths = images.map((img) => img.file_url);
      await supabase.storage.from("gallery-images").remove(filePaths);
    } catch (storageError) {
      console.warn("Failed to delete images from storage:", storageError);
      // Don't throw error for storage deletion failure
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
