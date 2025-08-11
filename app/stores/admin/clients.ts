import { defineStore } from "pinia";
import { clientService } from "~/services/clientService";
import type { Client, IClientFilters } from "~/types/client";

export const useClientsStore = defineStore("clients", () => {
  // State
  const clients = ref<Client[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const isInitialized = ref(false);

  // Pagination state
  const currentPage = ref(1);
  const totalItems = ref(0);
  const itemsPerPage = 20;

  // Filters state
  const searchQuery = ref("");
  const typeFilter = ref<"individual" | "company" | null>(null);
  const sortOrder = ref<
    "name_asc" | "name_desc" | "created_asc" | "created_desc"
  >("created_desc");

  // Simplified modal state
  const modalState = ref<{
    type: "create" | "edit" | "delete" | "multiple-delete" | null;
    data?: Client | Client[];
  }>({ type: null });

  // Loading states
  const deletionLoading = ref(false);
  const multipleDeletionLoading = ref(false);

  // Get current filters
  const getCurrentFilters = (): IClientFilters => ({
    search: searchQuery.value.trim() || undefined,
    type: typeFilter.value || undefined,
    sort: sortOrder.value,
  });

  // Computed
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage));

  // Actions
  const reset = () => {
    clients.value = [];
    currentPage.value = 1;
    totalItems.value = 0;
    error.value = null;
    isInitialized.value = false;
  };

  const fetchClients = async (filters: IClientFilters = {}, page = 1) => {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const pagination = {
        page,
        pageSize: itemsPerPage,
      };

      const result = await clientService.getClients(filters, pagination);

      clients.value = result.data;
      totalItems.value = result.total;
      currentPage.value = page;

      if (page === 1) {
        isInitialized.value = true;
      }

      return result.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch clients");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const refresh = async (filters?: IClientFilters) => {
    reset();
    const filtersToUse = filters || getCurrentFilters();
    return await fetchClients(filtersToUse, 1);
  };

  // Initialize store - follows Pinia best practices for Nuxt
  const initialize = async (filters?: IClientFilters) => {
    if (isInitialized.value && clients.value.length > 0) {
      return clients.value;
    }

    return await refresh(filters);
  };

  // Create debounced search function using VueUse
  const debouncedSearch = useDebounceFn(async () => {
    await refresh(getCurrentFilters());
  }, 300);

  // Search and filter actions
  const setSearchQuery = (query: string) => {
    searchQuery.value = query;
    debouncedSearch();
  };

  const setTypeFilter = (type: "individual" | "company" | null) => {
    typeFilter.value = type;
    debouncedSearch();
  };

  const setSortOrder = (
    order: "name_asc" | "name_desc" | "created_asc" | "created_desc"
  ) => {
    sortOrder.value = order;
    debouncedSearch();
  };

  const setPage = async (page: number) => {
    await fetchClients(getCurrentFilters(), page);
  };

  // Simplified modal actions
  const openCreateModal = () => {
    modalState.value = { type: "create" };
  };

  const openEditModal = (client: Client) => {
    modalState.value = { type: "edit", data: client };
  };

  const closeModal = () => {
    modalState.value = { type: null };
  };

  const openDeleteModal = (client: Client) => {
    modalState.value = { type: "delete", data: client };
  };

  const openMultipleDeleteModal = (selectedClients: Client[]) => {
    modalState.value = { type: "multiple-delete", data: selectedClients };
  };

  // CRUD actions
  const createClient = async (
    clientData: Omit<Client, "id" | "created_at" | "updated_at">
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const newClient = await clientService.createClient(clientData);
      clients.value = [newClient, ...clients.value];
      closeModal();
      return newClient;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to create client");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    loading.value = true;
    error.value = null;

    try {
      const updatedClient = await clientService.updateClient(id, updates);
      const index = clients.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        clients.value[index] = updatedClient;
      }
      closeModal();
      return updatedClient;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to update client");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteClient = async (id: string) => {
    deletionLoading.value = true;

    try {
      await clientService.deleteClient(id);
      clients.value = clients.value.filter((c) => c.id !== id);
      closeModal();
      return { resetSelection: true };
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete client");
      throw err;
    } finally {
      deletionLoading.value = false;
    }
  };

  // Multiple deletion actions
  const deleteMultipleClients = async () => {
    const clientsToDelete = modalState.value.data as Client[];
    if (!clientsToDelete?.length) return;

    multipleDeletionLoading.value = true;
    error.value = null;

    try {
      const ids = clientsToDelete.map((client) => client.id);
      const result = await clientService.deleteMultipleClients(ids);

      // Remove successfully deleted clients from the list
      if (result.success.length > 0) {
        clients.value = clients.value.filter(
          (client) => !result.success.includes(client.id)
        );
      }

      // Show appropriate message based on results
      if (result.success.length > 0 && result.failed.length === 0) {
        // All successful
        closeModal();
        return { resetSelection: true };
      } else if (result.success.length > 0 && result.failed.length > 0) {
        // Partial success - show error with details
        const errorMessage = `Suppression partielle : ${
          result.success.length
        } client(s) supprimé(s), ${
          result.failed.length
        } échec(s). Erreurs : ${result.errors.join(", ")}`;
        error.value = new Error(errorMessage);
        closeModal();
        return { resetSelection: true };
      } else {
        // All failed
        const errorMessage = `Échec de la suppression : ${result.errors.join(
          ", "
        )}`;
        error.value = new Error(errorMessage);
        closeModal();
      }
    } catch (err) {
      error.value =
        err instanceof Error
          ? err
          : new Error("Failed to delete multiple clients");
      closeModal();
    } finally {
      multipleDeletionLoading.value = false;
    }
  };

  const addClientToList = (client: Client) => {
    clients.value = [client, ...clients.value];
  };

  const updateClientInList = (updatedClient: Client) => {
    const index = clients.value.findIndex((c) => c.id === updatedClient.id);
    if (index !== -1) {
      clients.value[index] = updatedClient;
    }
  };

  return {
    // State
    clients: clients,
    loading: loading,
    error: error,
    isInitialized: isInitialized,

    // Pagination state
    currentPage,
    totalItems: totalItems,
    totalPages,

    // Filter state
    searchQuery,
    typeFilter,
    sortOrder,

    // Modal state
    modalState: modalState,
    deletionLoading: deletionLoading,
    multipleDeletionLoading: multipleDeletionLoading,

    // Actions
    reset,
    initialize,
    fetchClients,
    refresh,

    // Filter actions
    setSearchQuery,
    setTypeFilter,
    setSortOrder,
    setPage,

    // Modal actions
    openCreateModal,
    openEditModal,
    closeModal,
    openDeleteModal,
    openMultipleDeleteModal,

    // CRUD actions
    createClient,
    updateClient,
    deleteClient,
    deleteMultipleClients,
    addClientToList,
    updateClientInList,
  };
});
