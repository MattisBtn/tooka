export interface NotionImageUploadResult {
  success: boolean;
  url?: string;
  filePath?: string;
  error?: string;
}

export const notionImageService = {
  /**
   * Upload an image to the notion-images bucket
   */
  async uploadImage(file: File): Promise<NotionImageUploadResult> {
    try {
      const supabase = useSupabaseClient();
      const user = useSupabaseUser();

      if (!user.value) {
        return {
          success: false,
          error: "Vous devez être connecté pour uploader une image",
        };
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        return {
          success: false,
          error: "Le fichier doit être une image",
        };
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: "L'image ne peut pas dépasser 5MB",
        };
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `${user.value.id}/notion-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("notion-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        return {
          success: false,
          error: `Erreur lors de l'upload: ${uploadError.message}`,
        };
      }

      // Get public URL
      const { data } = supabase.storage
        .from("notion-images")
        .getPublicUrl(filePath);

      return {
        success: true,
        url: data.publicUrl,
        filePath,
      };
    } catch (error) {
      console.error("Erreur upload image Notion:", error);
      return {
        success: false,
        error: "Erreur inattendue lors de l'upload",
      };
    }
  },

  /**
   * Delete an image from the notion-images bucket
   */
  async deleteImage(filePath: string): Promise<boolean> {
    try {
      const supabase = useSupabaseClient();

      const { error } = await supabase.storage
        .from("notion-images")
        .remove([filePath]);

      if (error) {
        console.error("Erreur suppression image:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erreur suppression image:", error);
      return false;
    }
  },

  /**
   * Replace an existing image (delete old, upload new)
   */
  async replaceImage(
    oldFilePath: string,
    newFile: File
  ): Promise<NotionImageUploadResult> {
    try {
      // Upload new image first
      const uploadResult = await this.uploadImage(newFile);

      if (!uploadResult.success) {
        return uploadResult;
      }

      // Delete old image (don't fail if deletion fails)
      await this.deleteImage(oldFilePath);

      return uploadResult;
    } catch (error) {
      console.error("Erreur remplacement image:", error);
      return {
        success: false,
        error: "Erreur lors du remplacement de l'image",
      };
    }
  },
};
