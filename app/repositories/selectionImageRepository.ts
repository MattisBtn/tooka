import type {
  ISelectionImageRepository,
  SelectionImage,
} from "~/types/selection";

export const selectionImageRepository: ISelectionImageRepository = {
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

  /**
   * Find images by selection ID with pagination
   */
  async findBySelectionIdWithPagination(
    selectionId: string,
    limit: number,
    offset: number
  ): Promise<{ images: SelectionImage[]; totalCount: number }> {
    const supabase = useSupabaseClient();

    // Get total count
    const { count, error: countError } = await supabase
      .from("selection_images")
      .select("*", { count: "exact", head: true })
      .eq("selection_id", selectionId);

    if (countError) {
      throw new Error(
        `Failed to count selection images: ${countError.message}`
      );
    }

    // Get paginated images
    const { data, error } = await supabase
      .from("selection_images")
      .select("*")
      .eq("selection_id", selectionId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch selection images: ${error.message}`);
    }

    return {
      images: data || [],
      totalCount: count || 0,
    };
  },

  /**
   * Find only selected images by selection ID
   */
  async findSelectedBySelectionId(
    selectionId: string
  ): Promise<{ images: SelectionImage[] }> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("selection_images")
      .select("*")
      .eq("selection_id", selectionId)
      .eq("is_selected", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch selected images: ${error.message}`);
    }

    return {
      images: data || [],
    };
  },
};
