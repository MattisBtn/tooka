import type { Tables } from "~/types/database.types";

export interface IClientFilters {
  search?: string;
  type?: "individual" | "company" | null;
}

export type Client = Tables<"clients">;

export const useClients = () => {
  const supabase = useSupabaseClient();
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const clients = ref<Client[]>([]);
  const hasMore = ref(true);
  const page = ref(1);
  const pageSize = 20;

  // Reset all states
  const reset = () => {
    clients.value = [];
    hasMore.value = true;
    page.value = 1;
    error.value = null;
  };

  // Fetch clients with pagination and optional filters
  const fetchClients = async (filters: IClientFilters = {}) => {
    if (!hasMore.value || loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      let query = supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false })
        .range((page.value - 1) * pageSize, page.value * pageSize - 1);

      // Apply filters if provided
      if (filters.type) {
        query = query.eq("type", filters.type);
      }

      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,billing_email.ilike.%${filters.search}%`
        );
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (data.length < pageSize) {
        hasMore.value = false;
      }

      clients.value = page.value === 1 ? data : [...clients.value, ...data];
      page.value++;

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch clients");
      console.error("Error fetching clients:", err);
    } finally {
      loading.value = false;
    }
  };

  // Load more data (for infinite scrolling)
  const loadMore = async (filters: IClientFilters = {}) => {
    return await fetchClients(filters);
  };

  return {
    clients: readonly(clients),
    loading: readonly(loading),
    error: readonly(error),
    hasMore: readonly(hasMore),
    fetchClients,
    loadMore,
    reset,
  };
};
