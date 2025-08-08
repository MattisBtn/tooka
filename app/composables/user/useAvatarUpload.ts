import { useAuth } from "~/composables/auth/useAuth";
import { avatarService } from "~/services/avatarService";
import { useUserStore } from "~/stores/user";

interface AvatarUploadState {
  isUploading: boolean;
  error: string | null;
  previewUrl: string | null;
}

export const useAvatarUpload = () => {
  const { user } = useAuth();
  const userStore = useUserStore();
  const profile = computed(() => userStore.user.profile);

  const state = ref<AvatarUploadState>({
    isUploading: false,
    error: null,
    previewUrl: null,
  });

  /**
   * Réinitialiser l'état
   */
  const resetState = () => {
    state.value = {
      isUploading: false,
      error: null,
      previewUrl: null,
    };
  };

  /**
   * Créer une URL de prévisualisation pour le fichier
   */
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  /**
   * Nettoyer l'URL de prévisualisation
   */
  const cleanupPreviewUrl = () => {
    if (state.value.previewUrl) {
      URL.revokeObjectURL(state.value.previewUrl);
      state.value.previewUrl = null;
    }
  };

  /**
   * Valider un fichier avant upload
   */
  const validateFile = async (file: File): Promise<boolean> => {
    try {
      state.value.error = null;

      const validation = await avatarService.validateAvatarFile(file);

      if (!validation.valid) {
        state.value.error = validation.error || "Fichier invalide";
        return false;
      }

      return true;
    } catch {
      state.value.error = "Erreur lors de la validation du fichier";
      return false;
    }
  };

  /**
   * Uploader un avatar
   */
  const uploadAvatar = async (file: File): Promise<boolean> => {
    if (!user.value) {
      state.value.error = "Vous devez être connecté pour uploader un avatar";
      return false;
    }

    try {
      state.value.isUploading = true;
      state.value.error = null;

      // Valider le fichier
      const isValid = await validateFile(file);
      if (!isValid) {
        return false;
      }

      // Créer une prévisualisation
      cleanupPreviewUrl();
      state.value.previewUrl = createPreviewUrl(file);

      // Uploader et mettre à jour le profil
      const result = await avatarService.uploadAndUpdateAvatar(
        file,
        user.value.id
      );

      if (!result.success) {
        state.value.error = result.error || "Erreur lors de l'upload";
        cleanupPreviewUrl();
        return false;
      }

      // Rafraîchir le profil utilisateur
      await userStore.fetchUser();

      // Nettoyer la prévisualisation après succès
      cleanupPreviewUrl();

      return true;
    } catch (error) {
      console.error("Erreur inattendue lors de l'upload:", error);
      state.value.error = "Erreur inattendue lors de l'upload";
      cleanupPreviewUrl();
      return false;
    } finally {
      state.value.isUploading = false;
    }
  };

  /**
   * Supprimer l'avatar actuel
   */
  const removeAvatar = async (): Promise<boolean> => {
    if (!user.value) {
      state.value.error = "Vous devez être connecté pour supprimer l'avatar";
      return false;
    }

    try {
      state.value.isUploading = true;
      state.value.error = null;

      const result = await avatarService.deleteAvatar(user.value.id);

      if (!result.success) {
        state.value.error = result.error || "Erreur lors de la suppression";
        return false;
      }

      // Rafraîchir le profil utilisateur
      await userStore.fetchUser();

      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'avatar:", error);
      state.value.error = "Erreur lors de la suppression de l'avatar";
      return false;
    } finally {
      state.value.isUploading = false;
    }
  };

  /**
   * Nettoyer les avatars orphelins
   */
  const cleanupOrphanedAvatars = async (): Promise<void> => {
    if (!user.value) return;

    try {
      await avatarService.cleanupOrphanedAvatars(user.value.id);
    } catch (error) {
      console.warn("Erreur lors du nettoyage des avatars orphelins:", error);
    }
  };

  /**
   * Gestion des événements du FileUpload
   */
  const handleFileUpload = async (files: File[] | File | null) => {
    if (!files) {
      cleanupPreviewUrl();
      return;
    }

    const fileArray = Array.isArray(files) ? files : [files];
    const file = fileArray[0];

    if (!file) {
      cleanupPreviewUrl();
      return;
    }

    // Upload automatique du fichier
    await uploadAvatar(file);
  };

  /**
   * URL de l'avatar actuel
   */
  const currentAvatarUrl = computed(() => {
    return profile.value?.avatar_url || null;
  });

  /**
   * URL à afficher (prévisualisation ou avatar actuel)
   */
  const displayAvatarUrl = computed(() => {
    return state.value.previewUrl || currentAvatarUrl.value;
  });

  /**
   * Nom d'affichage pour l'avatar
   */
  const avatarAlt = computed(() => {
    if (profile.value?.first_name && profile.value?.last_name) {
      return `${profile.value.first_name} ${profile.value.last_name}`;
    }
    if (profile.value?.first_name) {
      return profile.value.first_name;
    }
    return user.value?.email || "Avatar";
  });

  /**
   * Nettoyage lors du démontage du composant
   */
  onUnmounted(() => {
    cleanupPreviewUrl();
  });

  return {
    // État
    isUploading: readonly(computed(() => state.value.isUploading)),
    error: readonly(computed(() => state.value.error)),
    previewUrl: readonly(computed(() => state.value.previewUrl)),
    currentAvatarUrl,
    displayAvatarUrl,
    avatarAlt,

    // Actions
    uploadAvatar,
    removeAvatar,
    handleFileUpload,
    resetState,
    cleanupOrphanedAvatars,
    validateFile,
  };
};
