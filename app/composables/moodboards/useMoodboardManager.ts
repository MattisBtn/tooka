/**
 * Composable unifié pour gérer les moodboards
 * Remplace useMoodboard pour simplifier l'architecture
 * Suit les patterns KISS, YAGNI et DRY
 */
import { moodboardService } from "~/services/moodboardService";
import type { Moodboard, MoodboardWithDetails } from "~/types/moodboard";

export const useMoodboardManager = (projectId: string) => {
  // État centralisé avec useState
  const moodboard = useState<MoodboardWithDetails | null>(
    `moodboard-${projectId}`,
    () => null
  );
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Méthodes principales
  const load = async (): Promise<MoodboardWithDetails | null> => {
    loading.value = true;
    error.value = null;

    try {
      const data = await moodboardService.getMoodboardByProjectId(projectId);
      moodboard.value = data;
      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Erreur de chargement";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const remove = async (): Promise<void> => {
    if (!moodboard.value?.id) return;

    loading.value = true;
    error.value = null;

    try {
      await moodboardService.deleteMoodboard(moodboard.value.id);
      moodboard.value = null;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur de suppression";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const uploadImages = async (files: File[]): Promise<void> => {
    if (!moodboard.value?.id) {
      throw new Error(
        "Le moodboard doit être créé avant d'uploader des images"
      );
    }

    loading.value = true;
    error.value = null;

    try {
      await moodboardService.uploadImages(moodboard.value.id, files);
      // Recharger les données pour obtenir les nouvelles images
      await load();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Erreur d'upload";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteImage = async (imageId: string): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      await moodboardService.deleteImage(imageId);
      // Recharger les données pour synchroniser
      await load();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur de suppression d'image";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const save = async (
    moodboardData: Omit<Moodboard, "id" | "created_at" | "updated_at">,
    files?: File[]
  ): Promise<{ moodboard: Moodboard; projectUpdated: boolean }> => {
    loading.value = true;
    error.value = null;

    try {
      let result: { moodboard: Moodboard; projectUpdated: boolean };

      // Créer ou mettre à jour le moodboard
      if (moodboard.value?.id) {
        // Mise à jour
        result = await moodboardService.updateMoodboard(
          moodboard.value.id,
          moodboardData,
          moodboardData.status === "awaiting_client"
        );
      } else {
        // Création
        result = await moodboardService.createMoodboard(
          moodboardData,
          moodboardData.status === "awaiting_client"
        );
      }

      // Upload des images si fournies
      if (files && files.length > 0) {
        await moodboardService.uploadImages(result.moodboard.id, files);
      }

      // Recharger les données pour synchroniser
      await load();

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Erreur de sauvegarde";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Computed helpers
  const exists = computed(() => !!moodboard.value);
  const canEdit = computed(
    () =>
      !moodboard.value ||
      ["draft", "revision_requested"].includes(moodboard.value.status)
  );

  const imageCount = computed(() => {
    return moodboard.value?.imageCount || 0;
  });

  const hasImages = computed(() => imageCount.value > 0);

  const statusInfo = computed(() => {
    if (!moodboard.value) return null;

    const statusMap: Record<
      string,
      { color: string; label: string; icon: string }
    > = {
      draft: {
        color: "neutral",
        label: "Brouillon",
        icon: "i-lucide-file-edit",
      },
      awaiting_client: {
        color: "warning",
        label: "En attente client",
        icon: "i-lucide-clock",
      },
      revision_requested: {
        color: "info",
        label: "Révision demandée",
        icon: "i-lucide-edit",
      },
      completed: {
        color: "success",
        label: "Validé",
        icon: "i-lucide-check-circle",
      },
    };

    return statusMap[moodboard.value.status] || null;
  });

  return {
    // État
    moodboard: readonly(moodboard),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    load,
    remove,
    uploadImages,
    deleteImage,
    save,

    // Computed
    exists,
    canEdit,
    imageCount,
    hasImages,
    statusInfo,
  };
};
