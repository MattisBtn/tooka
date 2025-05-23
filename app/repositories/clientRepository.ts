import type {
  Client,
  IClientFilters,
  IClientRepository,
  IPagination,
} from "~/types/client";

export const clientRepository: IClientRepository = {
  async findMany(
    filters: IClientFilters,
    pagination: IPagination
  ): Promise<Client[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder aux clients");
    }

    let query = supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.value.id)
      .order("created_at", { ascending: false })
      .range(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize - 1
      );

    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,billing_email.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }

    return data || [];
  },

  async findById(id: string): Promise<Client | null> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder à ce client");
    }

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.value.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch client: ${error.message}`);
    }

    return data;
  },

  async create(
    clientData: Omit<Client, "id" | "created_at" | "updated_at">
  ): Promise<Client> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("clients")
      .insert(clientData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create client: ${error.message}`);
    }

    return data;
  },

  async update(id: string, clientData: Partial<Client>): Promise<Client> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour modifier ce client");
    }

    const { data, error } = await supabase
      .from("clients")
      .update(clientData)
      .eq("id", id)
      .eq("user_id", user.value.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update client: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer ce client");
    }

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", user.value.id);

    if (error) {
      throw new Error(`Failed to delete client: ${error.message}`);
    }
  },
};
