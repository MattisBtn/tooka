export const videoService = {
  /**
   * Télécharger une vidéo
   */
  async uploadVideo(
    file: File
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    try {
      // Vérifier la taille du fichier (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        throw new Error(
          "Le fichier est trop volumineux. Taille maximum: 100MB"
        );
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
        throw new Error(
          "Type de fichier non supporté. Formats acceptés: MP4, WebM, MOV, AVI, MKV"
        );
      }

      // Créer un nom de fichier unique
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split(".").pop();
      const fileName = `video_${timestamp}_${randomId}.${extension}`;
      const filePath = `/notion-videos/${fileName}`;

      // Ici vous intégreriez votre logique d'upload vers votre storage
      // Par exemple avec Supabase Storage, AWS S3, etc.

      // Pour l'instant, on simule l'upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        filePath,
        fileName: file.name,
        fileSize: file.size,
      };
    } catch (error) {
      console.error("Erreur upload vidéo:", error);
      throw error;
    }
  },

  /**
   * Supprimer une vidéo
   */
  async deleteVideo(filePath: string): Promise<void> {
    try {
      // Ici vous intégreriez votre logique de suppression
      // Par exemple avec Supabase Storage, AWS S3, etc.

      // Pour l'instant, on simule la suppression
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Erreur suppression vidéo:", error);
      throw error;
    }
  },

  /**
   * Obtenir l'URL d'une vidéo
   */
  getVideoUrl(filePath: string): string {
    // Ici vous retourneriez l'URL complète de votre vidéo
    // Par exemple avec Supabase Storage, AWS S3, etc.
    return filePath.startsWith("http") ? filePath : `/api/uploads${filePath}`;
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
