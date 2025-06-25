import { onMounted, onUnmounted, ref } from "vue";
import { selectionService } from "~/services/selectionService";
import type { SelectionImageRealtimePayload } from "~/types/selection";

/**
 * Composable for real-time selection image updates
 * Provides granular control over conversion status monitoring
 */
export const useSelectionRealtime = (selectionId?: string) => {
  // State
  const isSubscribed = ref(false);
  const connectionStatus = ref<"connecting" | "connected" | "disconnected">(
    "disconnected"
  );
  const lastUpdate = ref<Date | null>(null);

  // Realtime subscription
  let realtimeSubscription: {
    unsubscribe: () => Promise<"ok" | "timed out" | "error">;
  } | null = null;

  // Event handlers
  const updateHandlers = new Set<
    (payload: SelectionImageRealtimePayload) => void
  >();
  const statusChangeHandlers = new Set<
    (status: string, imageId: string) => void
  >();

  // Methods
  const subscribe = async (targetSelectionId?: string) => {
    const id = targetSelectionId || selectionId;
    if (!id || isSubscribed.value) return;

    try {
      connectionStatus.value = "connecting";

      realtimeSubscription = selectionService.subscribeToSelectionImages(
        id,
        handleRealtimeUpdate
      );

      isSubscribed.value = true;
      connectionStatus.value = "connected";
    } catch (error) {
      console.error("Failed to subscribe to realtime updates:", error);
      connectionStatus.value = "disconnected";
      throw error;
    }
  };

  const unsubscribe = async () => {
    if (!realtimeSubscription) return;

    try {
      await realtimeSubscription.unsubscribe();
      realtimeSubscription = null;
      isSubscribed.value = false;
      connectionStatus.value = "disconnected";
    } catch (error) {
      console.error("Failed to unsubscribe from realtime updates:", error);
    }
  };

  const handleRealtimeUpdate = (payload: SelectionImageRealtimePayload) => {
    lastUpdate.value = new Date();

    // Notify all registered update handlers
    updateHandlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error("Error in realtime update handler:", error);
      }
    });

    // Handle specific conversion status changes
    if (
      payload.eventType === "UPDATE" &&
      payload.old.conversion_status !== payload.new.conversion_status
    ) {
      statusChangeHandlers.forEach((handler) => {
        try {
          handler(payload.new.conversion_status || "unknown", payload.new.id);
        } catch (error) {
          console.error("Error in status change handler:", error);
        }
      });
    }
  };

  // Handler management
  const onUpdate = (
    handler: (payload: SelectionImageRealtimePayload) => void
  ) => {
    updateHandlers.add(handler);

    // Return cleanup function
    return () => {
      updateHandlers.delete(handler);
    };
  };

  const onConversionStatusChange = (
    handler: (status: string, imageId: string) => void
  ) => {
    statusChangeHandlers.add(handler);

    // Return cleanup function
    return () => {
      statusChangeHandlers.delete(handler);
    };
  };

  // Lifecycle management
  onMounted(() => {
    if (selectionId) {
      subscribe();
    }
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    // State
    isSubscribed: readonly(isSubscribed),
    connectionStatus: readonly(connectionStatus),
    lastUpdate: readonly(lastUpdate),

    // Methods
    subscribe,
    unsubscribe,
    onUpdate,
    onConversionStatusChange,
  };
};
