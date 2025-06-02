import { clientRepository } from "~/repositories/clientRepository";
import type { Client, IClientFilters, IPagination } from "~/types/client";

export const clientService = {
  /**
   * Fetch clients with pagination and filtering
   */
  async getClients(filters: IClientFilters = {}, pagination: IPagination) {
    const clients = await clientRepository.findMany(filters, pagination);

    // Business logic: sort by priority if needed
    if (filters.type === "company") {
      return clients.sort((a, b) =>
        (b.company_name || "").localeCompare(a.company_name || "")
      );
    }

    return clients;
  },

  /**
   * Get client by ID with validation
   */
  async getClientById(id: string): Promise<Client> {
    if (!id?.trim()) {
      throw new Error("Client ID is required");
    }

    const client = await clientRepository.findById(id);

    if (!client) {
      throw new Error("Client not found");
    }

    return client;
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

    if (!clientData.billing_email) {
      throw new Error("Billing email is required");
    }

    // Add user_id from authenticated user
    const dataWithUserId = {
      ...clientData,
      user_id: user.value.id,
    };

    return await clientRepository.create(dataWithUserId);
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

    return await clientRepository.update(id, updates);
  },

  /**
   * Delete client with dependency checks
   */
  async deleteClient(id: string): Promise<void> {
    const _client = await this.getClientById(id);

    // Business rule: check for dependencies (invoices, projects, etc.)
    // This would typically check other tables
    // For now, just a placeholder

    await clientRepository.delete(id);
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

    return await this.getClients(filters, pagination);
  },

  /**
   * Get all clients for the current user (for dropdowns/selectors)
   */
  async getAllClients(
    filters: Omit<IClientFilters, "search"> = {}
  ): Promise<Client[]> {
    // Use a large page size to get all clients at once
    const pagination: IPagination = { page: 1, pageSize: 1000 };

    const clients = await clientRepository.findMany(filters, pagination);

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
