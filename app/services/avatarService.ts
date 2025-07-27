import { avatarRepository } from "~/repositories/avatarRepository";
import { userProfileRepository } from "~/repositories/userProfileRepository";
import type {
  IAvatarUploadResult,
  IAvatarValidationResult,
} from "~/types/avatar";
import { DEFAULT_AVATAR_CONFIG } from "~/types/avatar";

export const avatarService = {
  // Configuration
  config: DEFAULT_AVATAR_CONFIG,

  /**
   * Valider un fichier avatar
   */
  async validateAvatarFile(file: File): Promise<IAvatarValidationResult> {
    // Vérifier le type de fichier
    if (!this.config.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: "Format non supporté. Utilisez JPG, PNG ou WebP.",
      };
    }

    // Vérifier la taille
    if (file.size > this.config.MAX_FILE_SIZE) {
      const maxSizeMB = this.config.MAX_FILE_SIZE / (1024 * 1024);
      return {
        valid: false,
        error: `Le fichier est trop volumineux. Taille maximum : ${maxSizeMB}MB.`,
      };
    }

    // Vérifier les dimensions avec une promesse
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Vérifier les dimensions minimales
        if (
          img.width < this.config.MIN_WIDTH ||
          img.height < this.config.MIN_HEIGHT
        ) {
          resolve({
            valid: false,
            error: `Image trop petite. Dimensions minimales : ${this.config.MIN_WIDTH}x${this.config.MIN_HEIGHT}px.`,
          });
          return;
        }

        // Vérifier les dimensions maximales
        if (
          img.width > this.config.MAX_WIDTH ||
          img.height > this.config.MAX_HEIGHT
        ) {
          resolve({
            valid: false,
            error: `Image trop grande. Dimensions maximales : ${this.config.MAX_WIDTH}x${this.config.MAX_HEIGHT}px.`,
          });
          return;
        }

        resolve({ valid: true });
      };

      img.onerror = () => {
        resolve({
          valid: false,
          error: "Impossible de lire l'image. Fichier corrompu ?",
        });
      };

      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * Générer un nom de fichier unique pour l'avatar
   */
  generateAvatarFileName(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
    return `${userId}/avatar-${timestamp}.${extension}`;
  },

  /**
   * Extraire le chemin du fichier depuis une URL Supabase
   */
  extractFilePathFromUrl(url: string): string | null {
    try {
      const match = url.match(
        new RegExp(`/storage/v1/object/public/${this.config.BUCKET_NAME}/(.+)$`)
      );
      return match && match[1] ? match[1] : null;
    } catch {
      return null;
    }
  },

  /**
   * Supprimer l'ancien avatar d'un utilisateur
   */
  async deleteOldAvatar(userId: string): Promise<void> {
    try {
      // Récupérer le profil utilisateur pour obtenir l'URL de l'avatar actuel
      const profile = await userProfileRepository.findById(userId);

      if (profile?.avatar_url) {
        // Extraire le chemin du fichier depuis l'URL
        const path = this.extractFilePathFromUrl(profile.avatar_url);
        if (path) {
          // Supprimer le fichier (silencieux si le fichier n'existe pas)
          await avatarRepository.delete(path);
        }
      }
    } catch (error) {
      // Erreur silencieuse pour le nettoyage
      console.warn("Impossible de supprimer l'ancien avatar:", error);
    }
  },

  /**
   * Uploader un avatar vers Supabase Storage
   */
  async uploadAvatar(file: File, userId: string): Promise<IAvatarUploadResult> {
    try {
      // Valider le fichier
      const validation = await this.validateAvatarFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Générer le nom de fichier
      const fileName = this.generateAvatarFileName(userId, file.name);

      // Supprimer l'ancien avatar s'il existe
      await this.deleteOldAvatar(userId);

      // Uploader le nouveau fichier via le repository
      return await avatarRepository.upload(file, fileName);
    } catch (error) {
      console.error("Erreur inattendue lors de l'upload:", error);
      return {
        success: false,
        error: "Erreur inattendue. Veuillez réessayer.",
      };
    }
  },

  /**
   * Supprimer complètement un avatar
   */
  async deleteAvatar(userId: string): Promise<IAvatarUploadResult> {
    try {
      await this.deleteOldAvatar(userId);

      // Mettre à jour le profil pour retirer l'URL
      await userProfileRepository.update(userId, { avatar_url: null });

      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression de l'avatar:", error);
      return {
        success: false,
        error: "Erreur lors de la suppression. Veuillez réessayer.",
      };
    }
  },

  /**
   * Valider et uploader un avatar, puis mettre à jour le profil
   */
  async uploadAndUpdateAvatar(
    file: File,
    userId: string
  ): Promise<IAvatarUploadResult> {
    let uploadResult: IAvatarUploadResult | null = null;

    try {
      // Uploader le fichier
      uploadResult = await this.uploadAvatar(file, userId);

      if (!uploadResult.success) {
        return uploadResult;
      }

      // Mettre à jour le profil avec la nouvelle URL
      await userProfileRepository.update(userId, {
        avatar_url: uploadResult.url,
      });

      return uploadResult;
    } catch (error) {
      console.error("Erreur lors de l'upload et mise à jour:", error);

      // En cas d'erreur de mise à jour, supprimer le fichier uploadé
      if (uploadResult?.url) {
        const path = this.extractFilePathFromUrl(uploadResult.url);
        if (path) {
          await avatarRepository.delete(path);
        }
      }

      return {
        success: false,
        error: "Erreur lors de la mise à jour du profil.",
      };
    }
  },

  /**
   * Nettoyer tous les avatars orphelins d'un utilisateur
   */
  async cleanupOrphanedAvatars(userId: string): Promise<void> {
    try {
      // Lister tous les fichiers de l'utilisateur
      const files = await avatarRepository.listUserFiles(userId);

      if (files.length === 0) return;

      // Récupérer l'avatar actuel
      const profile = await userProfileRepository.findById(userId);
      const currentAvatarPath = profile?.avatar_url
        ? this.extractFilePathFromUrl(profile.avatar_url)
        : null;

      // Supprimer tous les fichiers sauf l'avatar actuel
      const filesToDelete = files.filter(
        (filePath) => filePath !== currentAvatarPath
      );

      for (const filePath of filesToDelete) {
        await avatarRepository.delete(filePath);
      }
    } catch (error) {
      console.warn("Erreur lors du nettoyage des avatars orphelins:", error);
    }
  },
};
