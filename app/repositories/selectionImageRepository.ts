import type {
  ISelectionImageRepository,
  SelectionImage,
} from "~/types/selection";

export const selectionImageRepository: ISelectionImageRepository = {
  async findBySelectionId(selectionId: string): Promise<SelectionImage[]> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("selection_images")
      .select("*")
      .eq("selection_id", selectionId)
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

    // Delete from database
    const { error } = await supabase
      .from("selection_images")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete selection image: ${error.message}`);
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

  /**
   * Get signed URL for secure download
   */
  async getSignedUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase.storage
      .from("selection-images")
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  },

  /**
   * Download image as blob for forced download
   */
  async downloadImageBlob(filePath: string): Promise<Blob> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase.storage
      .from("selection-images")
      .download(filePath);

    if (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }

    return data;
  },
};
