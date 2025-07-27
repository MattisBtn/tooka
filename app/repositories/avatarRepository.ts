import type { IAvatarRepository, IAvatarUploadResult } from "~/types/avatar";
import { DEFAULT_AVATAR_CONFIG } from "~/types/avatar";

export const avatarRepository: IAvatarRepository = {
  async upload(file: File, filePath: string): Promise<IAvatarUploadResult> {
    try {
      const supabase = useSupabaseClient();

      const { error } = await supabase.storage
        .from(DEFAULT_AVATAR_CONFIG.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("Erreur upload avatar:", error);
        return {
          success: false,
          error: "Erreur lors de l'upload. Veuillez réessayer.",
        };
      }

      // Générer l'URL publique
      const { data } = supabase.storage
        .from(DEFAULT_AVATAR_CONFIG.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: data.publicUrl,
      };
    } catch (error) {
      console.error("Erreur inattendue lors de l'upload:", error);
      return {
        success: false,
        error: "Erreur inattendue. Veuillez réessayer.",
      };
    }
  },

  async delete(filePath: string): Promise<void> {
    try {
      const supabase = useSupabaseClient();

      const { error } = await supabase.storage
        .from(DEFAULT_AVATAR_CONFIG.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.warn("Erreur lors de la suppression du fichier:", error);
      }
    } catch (error) {
      console.warn("Erreur lors de la suppression du fichier:", error);
    }
  },

  getPublicUrl(filePath: string): string {
    const supabase = useSupabaseClient();

    const { data } = supabase.storage
      .from(DEFAULT_AVATAR_CONFIG.BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async listUserFiles(userId: string): Promise<string[]> {
    try {
      const supabase = useSupabaseClient();

      const { data: files, error } = await supabase.storage
        .from(DEFAULT_AVATAR_CONFIG.BUCKET_NAME)
        .list(userId);

      if (error) {
        console.warn("Erreur lors de la récupération des fichiers:", error);
        return [];
      }

      return files?.map((file) => `${userId}/${file.name}`) || [];
    } catch (error) {
      console.warn("Erreur lors de la récupération des fichiers:", error);
      return [];
    }
  },
};
