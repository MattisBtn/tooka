import { clientService } from "~/services/clientService";
import type { Client, IClientFilters } from "~/types/client";

export const useClients = () => {
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const clients = ref<Client[]>([]);
  const hasMore = ref(true);
  const skip = ref(0);
  const pageSize = 20;

  // Reset all states
  const reset = () => {
    clients.value = [];
    hasMore.value = true;
    skip.value = 0;
    error.value = null;
  };

  // Fetch clients with pagination and optional filters
  const fetchClients = async (
    filters: IClientFilters = {},
    isInitialLoad = false
  ) => {
    if (!hasMore.value || loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const pagination = {
        page: Math.floor(skip.value / pageSize) + 1,
        pageSize,
      };
      const data = await clientService.getClients(filters, pagination);

      if (data.length < pageSize) {
        hasMore.value = false;
      }

      clients.value = isInitialLoad ? data : [...clients.value, ...data];
      skip.value += pageSize;

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch clients");
      console.error("Error fetching clients:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Load more data (for infinite scrolling)
  const loadMore = async (filters: IClientFilters = {}) => {
    return await fetchClients(filters, false);
  };

  // Initial load with smaller page size
  const initialLoad = async (filters: IClientFilters = {}) => {
    skip.value = 0;
    return await fetchClients(filters, true);
  };

  // Create a new client
  const createClient = async (
    clientData: Omit<Client, "id" | "created_at" | "updated_at">
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const newClient = await clientService.createClient(clientData);
      clients.value = [newClient, ...clients.value];
      return newClient;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to create client");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Update a client
  const updateClient = async (id: string, updates: Partial<Client>) => {
    loading.value = true;
    error.value = null;

    try {
      const updatedClient = await clientService.updateClient(id, updates);
      const index = clients.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        clients.value[index] = updatedClient;
      }
      return updatedClient;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to update client");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete a client
  const deleteClient = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      await clientService.deleteClient(id);
      clients.value = clients.value.filter((c) => c.id !== id);
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete client");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Add client to local list (for real-time updates)
  const addClientToList = (client: Client) => {
    clients.value = [client, ...clients.value];
  };

  // Update client in local list (for real-time updates)
  const updateClientInList = (updatedClient: Client) => {
    const index = clients.value.findIndex((c) => c.id === updatedClient.id);
    if (index !== -1) {
      clients.value[index] = updatedClient;
    }
  };

  return {
    // State
    clients: readonly(clients),
    loading: readonly(loading),
    error: readonly(error),
    hasMore: readonly(hasMore),
    skip: readonly(skip),

    // Actions
    fetchClients,
    loadMore,
    initialLoad,
    createClient,
    updateClient,
    deleteClient,
    addClientToList,
    updateClientInList,
    reset,
  };
};
