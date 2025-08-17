import type { Notification } from "~/types/notification";

export class NotificationService {
  private supabase: any;

  constructor() {
    this.supabase = useSupabaseClient();
  }

  // Récupérer toutes les notifications d'un utilisateur
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) throw error;
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
  }

  // Supprimer une notification
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) throw error;
  }

  // Supprimer toutes les notifications lues
  async deleteReadNotifications(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .eq("is_read", true);

    if (error) throw error;
  }
}
