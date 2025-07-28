import { computed, readonly, ref } from "vue";
import type { Database } from "~/types/database.types";
import type { SelectionFormData, SelectionImage } from "~/types/selection";

type SelectionData = Database["public"]["Tables"]["selections"]["Row"];

export const useSelectionManager = (projectId: string) => {
  // State
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selection = ref<SelectionData | null>(null);
  const images = ref<SelectionImage[]>([]);

  // Computed properties
  const exists = computed(() => !!selection.value);
  const isEditing = computed(() => false); // Pas d'état d'édition dans ce manager
  const canEdit = computed(() => {
    if (!selection.value) return true;
    return selection.value.status !== "completed";
  });

  const imageCount = computed(() => images.value.length);
  const selectedCount = computed(
    () => images.value.filter((img) => img.is_selected).length
  );
  const hasImages = computed(() => imageCount.value > 0);

  const formattedExtraMediaPrice = computed(() => {
    if (!selection.value?.extra_media_price) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(selection.value.extra_media_price / 100);
  });

  const statusInfo = computed(() => {
    if (!selection.value) return null;

    const statusOptions: Record<
      string,
      { color: string; label: string; icon: string }
    > = {
      draft: {
        color: "neutral",
        label: "Brouillon",
        icon: "i-lucide-mouse-pointer-click",
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

    return statusOptions[selection.value.status] || null;
  });

  // Actions
  const load = async (): Promise<SelectionData | null> => {
    loading.value = true;
    error.value = null;

    try {
      const { selectionService } = await import("~/services/selectionService");
      const result = await selectionService.getSelectionByProjectId(projectId);

      if (result) {
        selection.value = result;
        images.value = Array.from(result.images || []);
      } else {
        selection.value = null;
        images.value = [];
      }

      return selection.value;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const save = async (
    selectionData: SelectionFormData,
    files?: File[]
  ): Promise<{ selection: SelectionData; projectUpdated: boolean }> => {
    loading.value = true;
    error.value = null;

    try {
      const { selectionService } = await import("~/services/selectionService");

      let result;
      if (selection.value?.id) {
        // Mise à jour
        result = await selectionService.updateSelection(
          selection.value.id,
          selectionData
        );
      } else {
        // Création
        result = await selectionService.createSelection({
          ...selectionData,
          project_id: projectId,
          extra_media_price: selectionData.extra_media_price || null,
        });
      }

      // Upload des images si fournies
      if (files && files.length > 0 && result.selection.id) {
        await selectionService.uploadImages(result.selection.id, files);
      }

      // Recharger les données
      await load();

      return {
        selection: result.selection,
        projectUpdated: result.projectUpdated,
      };
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const remove = async (): Promise<void> => {
    if (!selection.value) return;

    loading.value = true;
    error.value = null;

    try {
      const { selectionService } = await import("~/services/selectionService");
      await selectionService.deleteSelection(selection.value.id);

      selection.value = null;
      images.value = [];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur lors de la suppression";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const uploadImages = async (files: File[]): Promise<void> => {
    if (!selection.value?.id) return;

    loading.value = true;
    error.value = null;

    try {
      const { selectionService } = await import("~/services/selectionService");
      await selectionService.uploadImages(selection.value.id, files);

      // Recharger les images
      await load();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur lors de l'upload";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteImage = async (imageId: string): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const { selectionService } = await import("~/services/selectionService");
      await selectionService.deleteImage(imageId);

      // Recharger les images
      await load();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur lors de la suppression";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    selection: readonly(selection),
    images: readonly(images),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    load,
    save,
    remove,
    uploadImages,
    deleteImage,

    // Computed
    exists,
    isEditing,
    canEdit,
    imageCount,
    selectedCount,
    hasImages,
    formattedExtraMediaPrice,
    statusInfo,
  };
};
