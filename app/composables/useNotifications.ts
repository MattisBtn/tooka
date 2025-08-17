import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Notification } from "~/types/notification";

export const useNotifications = () => {
  const client = useSupabaseClient();
  const user = useSupabaseUser();

  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  let realtimeChannel: RealtimeChannel | null = null;

  // Charger les notifications
  const loadNotifications = async () => {
    if (!user.value) return;

    isLoading.value = true;
    error.value = null;

    try {
      const { data, error: supabaseError } = await client
        .from("notifications")
        .select("*")
        .eq("user_id", user.value.id)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      notifications.value = data || [];
      updateUnreadCount();
    } catch (err) {
      error.value = "Erreur lors du chargement des notifications";
      console.error("Error loading notifications:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // Marquer comme lu
  const markAsRead = async (notificationId: string) => {
    if (!user.value) return;

    try {
      const { error: supabaseError } = await client
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .eq("user_id", user.value.id);

      if (supabaseError) throw supabaseError;

      // Mettre à jour localement
      const index = notifications.value.findIndex(
        (n) => n.id === notificationId
      );
      if (index !== -1 && notifications.value[index]) {
        notifications.value[index].is_read = true;
        notifications.value[index].read_at = new Date().toISOString();
        updateUnreadCount();
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    if (!user.value || unreadCount.value === 0) return;

    try {
      const { error: supabaseError } = await client
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", user.value.id)
        .eq("is_read", false);

      if (supabaseError) throw supabaseError;

      // Mettre à jour localement
      notifications.value.forEach((n) => {
        if (!n.is_read) {
          n.is_read = true;
          n.read_at = new Date().toISOString();
        }
      });
      updateUnreadCount();
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Mettre à jour le compteur de non-lues
  const updateUnreadCount = () => {
    unreadCount.value = notifications.value.filter((n) => !n.is_read).length;
  };

  // Écouter les nouvelles notifications en temps réel
  const setupRealtime = () => {
    if (!user.value) return;

    realtimeChannel = client
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.value.id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newNotification = payload.new as Notification;
          notifications.value.unshift(newNotification);
          updateUnreadCount();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.value.id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const updatedNotification = payload.new as Notification;
          const index = notifications.value.findIndex(
            (n) => n.id === updatedNotification.id
          );
          if (index !== -1) {
            notifications.value[index] = updatedNotification;
            updateUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      if (realtimeChannel) {
        client.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    };
  };

  // Initialiser
  const init = () => {
    loadNotifications();
    return setupRealtime();
  };

  // Cleanup on unmount
  const cleanup = () => {
    if (realtimeChannel) {
      client.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };

  return {
    // État
    notifications,
    unreadCount,
    isLoading,
    error,

    // Actions
    loadNotifications,
    markAsRead,
    markAllAsRead,
    init,
    cleanup,
  };
};
