import type { GalleryImage, IGalleryImageRepository } from "~/types/gallery";

export const galleryImageRepository: IGalleryImageRepository = {
  async findByGalleryId(galleryId: string): Promise<GalleryImage[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder aux images");
    }

    // Verify gallery belongs to user through project relationship
    const { data, error } = await supabase
      .from("gallery_images")
      .select(
        `
        *,
        gallery:galleries!inner(
          id,
          project:projects!inner(
            user_id
          )
        )
      `
      )
      .eq("gallery_id", galleryId)
      .eq("gallery.project.user_id", user.value.id)
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
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour ajouter une image");
    }

    // Verify gallery belongs to user
    const galleryCheck = await supabase
      .from("galleries")
      .select(
        `
        id,
        project:projects!inner(
          user_id
        )
      `
      )
      .eq("id", imageData.gallery_id)
      .eq("project.user_id", user.value.id)
      .single();

    if (galleryCheck.error) {
      throw new Error("Galerie non trouvée ou accès non autorisé");
    }

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
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour modifier cette image");
    }

    // Verify image belongs to user through gallery->project relationship
    const existingImage = await supabase
      .from("gallery_images")
      .select(
        `
        id,
        gallery:galleries!inner(
          project:projects!inner(
            user_id
          )
        )
      `
      )
      .eq("id", id)
      .eq("gallery.project.user_id", user.value.id)
      .single();

    if (existingImage.error) {
      throw new Error("Image non trouvée ou accès non autorisé");
    }

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
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer cette image");
    }

    // Verify image belongs to user through gallery->project relationship
    const existingImage = await supabase
      .from("gallery_images")
      .select(
        `
        id,
        file_url,
        gallery:galleries!inner(
          project:projects!inner(
            user_id
          )
        )
      `
      )
      .eq("id", id)
      .eq("gallery.project.user_id", user.value.id)
      .single();

    if (existingImage.error) {
      throw new Error("Image non trouvée ou accès non autorisé");
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
    try {
      await supabase.storage
        .from("gallery-images")
        .remove([existingImage.data.file_url]);
    } catch (storageError) {
      console.warn("Failed to delete image from storage:", storageError);
      // Don't throw error for storage deletion failure
    }
  },

  async deleteMany(galleryId: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer les images");
    }

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
