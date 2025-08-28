export interface VideoUploadResult {
  success: boolean;
  url?: string;
  filePath?: string;
  error?: string;
}

export const videoService = {
  /**
   * Upload une vidéo vers le bucket proposals
   */
  async uploadVideo(
    file: File,
    proposalId?: string
  ): Promise<VideoUploadResult> {
    try {
      const supabase = useSupabaseClient();
      const user = useSupabaseUser();

      if (!user.value) {
        return {
          success: false,
          error: "Vous devez être connecté pour uploader une vidéo",
        };
      }

      if (!proposalId) {
        return {
          success: false,
          error: "ID de proposition requis pour l'upload",
        };
      }

      // Vérifier le type de fichier
      const allowedTypes = [
        "video/mp4",
        "video/webm",
        "video/mov",
        "video/avi",
        "video/mkv",
      ];
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error:
            "Type de fichier non supporté. Formats acceptés: MP4, WebM, MOV, AVI, MKV",
        };
      }

      // Vérifier la taille du fichier (100MB max)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: "La vidéo ne peut pas dépasser 100MB",
        };
      }

      // Générer un nom de fichier unique
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `${user.value.id}/${proposalId}/videos/${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("proposals")
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

      // Obtenir l'URL publique
      const { data } = supabase.storage
        .from("proposals")
        .getPublicUrl(filePath);

      return {
        success: true,
        url: data.publicUrl,
        filePath,
      };
    } catch (error) {
      console.error("Erreur upload vidéo:", error);
      return {
        success: false,
        error: "Erreur inattendue lors de l'upload",
      };
    }
  },

  /**
   * Supprimer une vidéo du bucket proposals
   */
  async deleteVideo(filePath: string): Promise<boolean> {
    try {
      const supabase = useSupabaseClient();

      const { error } = await supabase.storage
        .from("proposals")
        .remove([filePath]);

      if (error) {
        console.error("Erreur suppression vidéo:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erreur suppression vidéo:", error);
      return false;
    }
  },

  /**
   * Remplacer une vidéo existante (supprimer l'ancienne, uploader la nouvelle)
   */
  async replaceVideo(
    oldFilePath: string,
    newFile: File,
    proposalId?: string
  ): Promise<VideoUploadResult> {
    try {
      // Supprimer l'ancienne vidéo
      await this.deleteVideo(oldFilePath);

      // Uploader la nouvelle vidéo
      return await this.uploadVideo(newFile, proposalId);
    } catch (error) {
      console.error("Erreur remplacement vidéo:", error);
      return {
        success: false,
        error: "Erreur lors du remplacement de la vidéo",
      };
    }
  },

  /**
   * Obtenir l'URL d'une vidéo
   */
  getVideoUrl(filePath: string): string {
    const supabase = useSupabaseClient();
    const { data } = supabase.storage.from("proposals").getPublicUrl(filePath);
    return data.publicUrl;
  },

  /**
   * Vérifier si une URL est une vidéo embed valide
   */
  isValidEmbedUrl(url: string): boolean {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/,
      /vimeo\.com\/(\d+)/,
      /dailymotion\.com\/video\//,
      /player\.vimeo\.com\/video\//,
    ];

    return patterns.some((pattern) => pattern.test(url));
  },

  /**
   * Détecter le provider d'une URL
   */
  detectProvider(url: string): string | undefined {
    if (url.includes("youtube.com") || url.includes("youtu.be"))
      return "youtube";
    if (url.includes("vimeo.com")) return "vimeo";
    if (url.includes("dailymotion.com")) return "dailymotion";
    return undefined;
  },
};
