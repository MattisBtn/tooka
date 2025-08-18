import type { TablesInsert, TablesUpdate } from "~/types/database.types";
import type { IUserProfileRepository, UserProfile } from "~/types/userProfile";

export const userProfileRepository: IUserProfileRepository = {
  async findById(
    id: string
  ): Promise<
    (UserProfile & { clientsCount?: number; projectsCount?: number }) | null
  > {
    const supabase = useSupabaseClient();

    // Récupérer le profil avec les relations
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select(
        `
        *,
        subscription_plans (
          id,
          name,
          description,
          price_monthly,
          price_yearly,
          features,
          is_active
        )
      `
      )
      .eq("id", id)
      .single();

    if (profileError) {
      if (profileError.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    // Récupérer le nombre de clients
    const { count: clientsCount, error: clientsError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id);

    if (clientsError) {
      console.warn(`Failed to fetch clients count: ${clientsError.message}`);
    }

    // Récupérer le nombre de projets
    const { count: projectsCount, error: projectsError } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id);

    if (projectsError) {
      console.warn(`Failed to fetch projects count: ${projectsError.message}`);
    }

    return {
      ...profile,
      clientsCount: clientsCount || 0,
      projectsCount: projectsCount || 0,
    };
  },

  async create(
    profileData: Omit<UserProfile, "id" | "created_at" | "updated_at">
  ): Promise<UserProfile> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour créer un profil");
    }

    const insertData: TablesInsert<"user_profiles"> = {
      ...profileData,
      id: user.value.id,
    };

    const { data, error } = await supabase
      .from("user_profiles")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return data;
  },

  async update(
    id: string,
    profileData: Partial<UserProfile>
  ): Promise<UserProfile> {
    const supabase = useSupabaseClient();

    const updateData: TablesUpdate<"user_profiles"> = {
      ...profileData,
    };

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return data;
  },

  async upsert(
    profileData: Omit<UserProfile, "created_at" | "updated_at">
  ): Promise<UserProfile> {
    const supabase = useSupabaseClient();

    const upsertData: TablesInsert<"user_profiles"> = {
      ...profileData,
    };

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(upsertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert user profile: ${error.message}`);
    }

    return data;
  },
};
