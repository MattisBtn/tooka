import type {
  Feedback,
  FeedbackInsert,
  FeedbackWithUser,
} from "~/types/feedback";

export const feedbackRepository = {
  async findById(id: string): Promise<FeedbackWithUser | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("feedback")
      .select(
        `
        *,
        user_profile:user_profiles(first_name, last_name)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch feedback: ${error.message}`);
    }

    return data as FeedbackWithUser;
  },

  async findMany(): Promise<FeedbackWithUser[]> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("feedback")
      .select(
        `
        *,
        user_profile:user_profiles(first_name, last_name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch feedbacks: ${error.message}`);
    }

    return (data as FeedbackWithUser[]) || [];
  },

  async findByUserId(userId: string): Promise<Feedback[]> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user feedbacks: ${error.message}`);
    }

    return data || [];
  },

  async create(feedbackData: FeedbackInsert): Promise<Feedback> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("feedback")
      .insert(feedbackData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create feedback: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = useSupabaseClient();

    const { error } = await supabase.from("feedback").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete feedback: ${error.message}`);
    }
  },
};
