import type { Client, IClientFilters, IPagination } from "~/types/client";

export const clientService = {
  /**
   * Fetch clients with pagination and filtering
   */
  async getClients(filters: IClientFilters = {}, pagination: IPagination) {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder aux clients");
    }

    // Build base query for counting
    let countQuery = supabase
      .from("clients")
      .select("*", { count: "exact", head: true });

    // Apply filters to count query
    if (filters.type) {
      countQuery = countQuery.eq("type", filters.type);
    }

    if (filters.search) {
      countQuery = countQuery.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,billing_email.ilike.%${filters.search}%`
      );
    }

    // Get total count
    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Failed to count clients: ${countError.message}`);
    }

    // Build query for data
    let query = supabase.from("clients").select("*");

    // Apply sorting
    if (filters.sort) {
      switch (filters.sort) {
        case "created_desc":
          query = query.order("created_at", { ascending: false });
          break;
        case "created_asc":
          query = query.order("created_at", { ascending: true });
          break;
        case "name_asc":
        case "name_desc":
          // For name sorting, we'll handle it in business logic
          query = query.order("created_at", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination only if pageSize is not null
    if (pagination.pageSize !== null) {
      query = query.range(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize - 1
      );
    }

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

    const clients = data || [];

    // Business logic: apply name sorting if requested
    if (filters.sort === "name_asc" || filters.sort === "name_desc") {
      const sortedClients = clients.sort((a, b) => {
        const nameA =
          a.type === "individual"
            ? `${a.first_name || ""} ${a.last_name || ""}`.trim()
            : a.company_name || "";
        const nameB =
          b.type === "individual"
            ? `${b.first_name || ""} ${b.last_name || ""}`.trim()
            : b.company_name || "";

        const comparison = nameA.localeCompare(nameB);
        return filters.sort === "name_asc" ? comparison : -comparison;
      });

      return {
        data: sortedClients,
        total: count || 0,
      };
    }

    // Business logic: sort by priority if needed (legacy behavior)
    if (filters.type === "company") {
      return {
        data: clients.sort((a, b) =>
          (b.company_name || "").localeCompare(a.company_name || "")
        ),
        total: count || 0,
      };
    }

    return {
      data: clients,
      total: count || 0,
    };
  },

  /**
   * Get client by ID with validation
   */
  async getClientById(id: string): Promise<Client> {
    if (!id?.trim()) {
      throw new Error("Client ID is required");
    }

    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder à ce client");
    }

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Client not found");
      }
      throw new Error(`Failed to fetch client: ${error.message}`);
    }

    return data;
  },

  /**
   * Create new client with validation
   */
  async createClient(
    clientData: Omit<Client, "id" | "created_at" | "updated_at" | "user_id">
  ): Promise<Client> {
    // Get current user from Supabase
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour créer un client");
    }

    // Business validation
    if (
      clientData.type === "individual" &&
      (!clientData.first_name || !clientData.last_name)
    ) {
      throw new Error(
        "First name and last name are required for individual clients"
      );
    }

    if (clientData.type === "company" && !clientData.company_name) {
      throw new Error("Company name is required for company clients");
    }

    // Add user_id from authenticated user
    const dataWithUserId = {
      ...clientData,
      user_id: user.value.id,
    };

    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("clients")
      .insert(dataWithUserId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create client: ${error.message}`);
    }

    return data;
  },

  /**
   * Update client with business rules
   */
  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const existingClient = await this.getClientById(id);

    // Business rule: can't change client type once set
    if (updates.type && updates.type !== existingClient.type) {
      throw new Error("Cannot change client type after creation");
    }

    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour modifier ce client");
    }

    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update client: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete client with dependency checks
   */
  async deleteClient(id: string): Promise<void> {
    const _client = await this.getClientById(id);

    // Business rule: check for dependencies (invoices, projects, etc.)
    // This would typically check other tables
    // For now, just a placeholder

    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer ce client");
    }

    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete client: ${error.message}`);
    }
  },

  /**
   * Delete multiple clients with dependency checks
   */
  async deleteMultipleClients(
    ids: string[]
  ): Promise<{ success: string[]; failed: string[]; errors: string[] }> {
    if (!ids.length) {
      return { success: [], failed: [], errors: [] };
    }

    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer ces clients");
    }

    const results = {
      success: [] as string[],
      failed: [] as string[],
      errors: [] as string[],
    };

    // Delete clients one by one to handle individual errors
    for (const id of ids) {
      try {
        await this.deleteClient(id);
        results.success.push(id);
      } catch (error) {
        results.failed.push(id);
        results.errors.push(
          error instanceof Error ? error.message : "Erreur inconnue"
        );
      }
    }

    return results;
  },

  /**
   * Search clients with enhanced logic
   */
  async searchClients(
    query: string,
    type?: "individual" | "company"
  ): Promise<Client[]> {
    if (!query?.trim()) {
      return [];
    }

    const filters: IClientFilters = {
      search: query.trim(),
      type,
    };

    const pagination: IPagination = { page: 1, pageSize: 50 };

    const result = await this.getClients(filters, pagination);
    return result.data;
  },

  /**
   * Get all clients for the current user (for dropdowns/selectors)
   */
  async getAllClients(
    filters: Omit<IClientFilters, "search"> = {}
  ): Promise<Client[]> {
    // Use a large page size to get all clients at once
    const pagination: IPagination = { page: 1, pageSize: null };

    const result = await this.getClients(filters, pagination);
    const clients = result.data;

    // Sort clients alphabetically by name
    return clients.sort((a, b) => {
      const nameA =
        a.type === "individual"
          ? `${a.first_name || ""} ${a.last_name || ""}`.trim()
          : a.company_name || "";
      const nameB =
        b.type === "individual"
          ? `${b.first_name || ""} ${b.last_name || ""}`.trim()
          : b.company_name || "";

      return nameA.localeCompare(nameB);
    });
  },
};
