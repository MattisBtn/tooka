import type {
  ISelectionImageRepository,
  SelectionImage,
  SelectionImageRealtimePayload,
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
        source_file_url,
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

    // Delete from database first
    const { error } = await supabase
      .from("selection_images")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete selection image: ${error.message}`);
    }

    // Collect all file paths to delete from storage
    const filesToDelete = [];
    const imageData = existingImage.data;

    // Add main file URL
    if (imageData.file_url) {
      filesToDelete.push(imageData.file_url);
    }

    // Add source file URL if different from main file URL
    if (
      imageData.source_file_url &&
      imageData.source_file_url !== imageData.file_url
    ) {
      filesToDelete.push(imageData.source_file_url);
    }

    // Delete all files from storage
    if (filesToDelete.length > 0) {
      try {
        const { error: storageError } = await supabase.storage
          .from("selection-images")
          .remove(filesToDelete);

        if (storageError) {
          console.warn(
            "Failed to delete some files from storage:",
            storageError
          );
          // Don't throw error for storage deletion failure as DB deletion was successful
        }
      } catch (storageError) {
        console.warn("Failed to delete files from storage:", storageError);
        // Don't throw error for storage deletion failure
      }
    }
  },

  async deleteMany(selectionId: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer les images");
    }

    // Get all images for the selection with their file URLs
    const images = await this.findBySelectionId(selectionId);

    if (images.length === 0) return;

    // Delete from database first
    const { error } = await supabase
      .from("selection_images")
      .delete()
      .eq("selection_id", selectionId);

    if (error) {
      throw new Error(`Failed to delete selection images: ${error.message}`);
    }

    // Collect all unique file paths to delete from storage
    const filesToDelete = new Set<string>();

    images.forEach((img) => {
      // Add main file URL
      if (img.file_url) {
        filesToDelete.add(img.file_url);
      }

      // Add source file URL if different from main file URL
      if (img.source_file_url && img.source_file_url !== img.file_url) {
        filesToDelete.add(img.source_file_url);
      }
    });

    // Delete all files from storage
    if (filesToDelete.size > 0) {
      try {
        const filePathsArray = Array.from(filesToDelete);
        const { error: storageError } = await supabase.storage
          .from("selection-images")
          .remove(filePathsArray);

        if (storageError) {
          console.warn(
            "Failed to delete some files from storage:",
            storageError
          );
          // Don't throw error for storage deletion failure as DB deletion was successful
        }
      } catch (storageError) {
        console.warn("Failed to delete files from storage:", storageError);
        // Don't throw error for storage deletion failure
      }
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
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder à l'image");
    }

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
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour télécharger l'image");
    }

    const { data, error } = await supabase.storage
      .from("selection-images")
      .download(filePath);

    if (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }

    return data;
  },

  /**
   * Subscribe to real-time changes for selection images
   */
  subscribeToSelectionImages(
    selectionId: string,
    callback: (payload: SelectionImageRealtimePayload) => void
  ) {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error(
        "Vous devez être connecté pour s'abonner aux changements"
      );
    }

    const subscription = supabase
      .channel(`selection_images_${selectionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "selection_images",
          filter: `selection_id=eq.${selectionId}`,
        },
        (payload) => {
          callback({
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: payload.new as SelectionImage,
            old: payload.old as SelectionImage,
          });
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        return supabase.removeChannel(subscription);
      },
    };
  },

  /**
   * Update conversion status for multiple images
   */
  async updateConversionStatus(
    imageIds: string[],
    status:
      | "pending"
      | "queued"
      | "processing"
      | "completed"
      | "failed"
      | "retrying"
      | "cancelled"
  ): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error(
        "Vous devez être connecté pour modifier le statut de conversion"
      );
    }

    const { error } = await supabase
      .from("selection_images")
      .update({ conversion_status: status })
      .in("id", imageIds);

    if (error) {
      throw new Error(`Failed to update conversion status: ${error.message}`);
    }
  },

  /**
   * Get images that require conversion for a selection
   */
  async getImagesRequiringConversion(
    selectionId: string,
    statuses: (
      | "pending"
      | "queued"
      | "processing"
      | "completed"
      | "failed"
      | "retrying"
      | "cancelled"
    )[] = ["pending", "failed"]
  ): Promise<SelectionImage[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder aux images");
    }

    const { data, error } = await supabase
      .from("selection_images")
      .select(
        `
        *,
        selection:selections!inner(
          project:projects!inner(
            user_id
          )
        )
      `
      )
      .eq("selection_id", selectionId)
      .eq("requires_conversion", true)
      .in("conversion_status", statuses)
      .eq("selection.project.user_id", user.value.id);

    if (error) {
      throw new Error(
        `Failed to fetch images requiring conversion: ${error.message}`
      );
    }

    return data || [];
  },
};
