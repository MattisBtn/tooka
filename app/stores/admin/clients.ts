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

  // Modal state
  const showModal = ref(false);
  const selectedClient = ref<Client | undefined>(undefined);
  const showDeleteModal = ref(false);
  const clientToDelete = ref<Client | null>(null);
  const deletionLoading = ref(false);

  // Multiple deletion state
  const showMultipleDeleteModal = ref(false);
  const clientsToDelete = ref<Client[]>([]);
  const multipleDeletionLoading = ref(false);

  // Get current filters
  const getCurrentFilters = (): IClientFilters => ({
    search: searchQuery.value.trim() || undefined,
    type: typeFilter.value || undefined,
    sort: sortOrder.value,
  });

  // Getters
  const filteredClients = computed(() => clients.value);
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage));

  // Type options for UI
  const typeOptions = [
    { value: null, label: "Tous les types" },
    { value: "individual" as const, label: "Particulier", color: "primary" },
    { value: "company" as const, label: "Professionnel", color: "secondary" },
  ];

  // Sort options for UI
  const sortOptions = [
    {
      value: "created_desc" as const,
      label: "Plus récents",
      icon: "i-lucide-calendar-days",
    },
    {
      value: "created_asc" as const,
      label: "Plus anciens",
      icon: "i-lucide-calendar-days",
    },
    { value: "name_asc" as const, label: "Nom A-Z", icon: "i-lucide-sort-asc" },
    {
      value: "name_desc" as const,
      label: "Nom Z-A",
      icon: "i-lucide-sort-desc",
    },
  ];

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

  // Modal actions
  const openCreateModal = () => {
    selectedClient.value = undefined;
    showModal.value = true;
  };

  const openEditModal = (client: Client) => {
    selectedClient.value = client;
    showModal.value = true;
  };

  const closeModal = () => {
    showModal.value = false;
    selectedClient.value = undefined;
  };

  const openDeleteModal = (client: Client) => {
    clientToDelete.value = client;
    showDeleteModal.value = true;
  };

  const closeDeleteModal = () => {
    showDeleteModal.value = false;
    clientToDelete.value = null;
    deletionLoading.value = false;
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
      closeDeleteModal();
      // Reset row selection after deletion
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
  const openMultipleDeleteModal = (selectedClients: Client[]) => {
    clientsToDelete.value = selectedClients;
    showMultipleDeleteModal.value = true;
  };

  const closeMultipleDeleteModal = () => {
    showMultipleDeleteModal.value = false;
    clientsToDelete.value = [];
    multipleDeletionLoading.value = false;
  };

  const deleteMultipleClients = async () => {
    if (!clientsToDelete.value.length) return;

    multipleDeletionLoading.value = true;
    error.value = null;

    try {
      const ids = clientsToDelete.value.map((client) => client.id);
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
        closeMultipleDeleteModal();
        return { resetSelection: true };
      } else if (result.success.length > 0 && result.failed.length > 0) {
        // Partial success - show error with details
        const errorMessage = `Suppression partielle : ${
          result.success.length
        } client(s) supprimé(s), ${
          result.failed.length
        } échec(s). Erreurs : ${result.errors.join(", ")}`;
        error.value = new Error(errorMessage);
        closeMultipleDeleteModal();
        return { resetSelection: true };
      } else {
        // All failed
        const errorMessage = `Échec de la suppression : ${result.errors.join(
          ", "
        )}`;
        error.value = new Error(errorMessage);
        closeMultipleDeleteModal();
      }
    } catch (err) {
      error.value =
        err instanceof Error
          ? err
          : new Error("Failed to delete multiple clients");
      closeMultipleDeleteModal();
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
    clients: readonly(clients),
    loading: readonly(loading),
    error: readonly(error),
    isInitialized: readonly(isInitialized),

    // Pagination state
    currentPage,
    totalItems: readonly(totalItems),
    totalPages,

    // Filter state
    searchQuery,
    typeFilter,
    sortOrder,

    // Modal state
    showModal,
    selectedClient: readonly(selectedClient),
    showDeleteModal,
    clientToDelete: readonly(clientToDelete),
    deletionLoading: readonly(deletionLoading),
    showMultipleDeleteModal,
    clientsToDelete: readonly(clientsToDelete),
    multipleDeletionLoading: readonly(multipleDeletionLoading),

    // Getters
    filteredClients,
    isLoading,
    hasError,
    typeOptions,
    sortOptions,

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
    closeDeleteModal,
    openMultipleDeleteModal,
    closeMultipleDeleteModal,

    // CRUD actions
    createClient,
    updateClient,
    deleteClient,
    deleteMultipleClients,
    addClientToList,
    updateClientInList,
  };
});
