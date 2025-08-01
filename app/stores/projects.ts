import { defineStore } from "pinia";
import { projectService } from "~/services/projectService";
import type {
  IProjectFilters,
  Project,
  ProjectFormData,
  ProjectWithClient,
} from "~/types/project";

export const useProjectsStore = defineStore("projects", () => {
  // State
  const projects = ref<ProjectWithClient[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const isInitialized = ref(false);

  // Pagination state
  const currentPage = ref(1);
  const totalItems = ref(0);
  const itemsPerPage = 20;

  // Filters state
  const searchQuery = ref("");
  const statusFilter = ref<"draft" | "in_progress" | "completed" | null>(null);

  // Modal state
  const showModal = ref(false);
  const selectedProject = ref<ProjectWithClient | undefined>(undefined);
  const showDeleteModal = ref(false);
  const projectToDelete = ref<ProjectWithClient | null>(null);
  const deletionLoading = ref(false);

  // Get current filters
  const getCurrentFilters = (): IProjectFilters => ({
    search: searchQuery.value.trim() || undefined,
    status: statusFilter.value || undefined,
  });

  // Getters
  const filteredProjects = computed(() => projects.value);
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage));

  // Status options for UI
  const statusOptions = [
    { value: null, label: "Tous les statuts" },
    { value: "draft" as const, label: "Brouillon", color: "neutral" },
    { value: "in_progress" as const, label: "En cours", color: "info" },
    { value: "completed" as const, label: "Terminé", color: "success" },
  ];

  // Actions
  const reset = () => {
    projects.value = [];
    currentPage.value = 1;
    totalItems.value = 0;
    error.value = null;
    isInitialized.value = false;
  };

  const fetchProjects = async (filters: IProjectFilters = {}, page = 1) => {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const pagination = {
        page,
        pageSize: itemsPerPage,
      };

      const result = await projectService.getProjects(filters, pagination);

      projects.value = result.data;
      totalItems.value = result.total;
      currentPage.value = page;

      if (page === 1) {
        isInitialized.value = true;
      }

      return result.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch projects");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const refresh = async (filters?: IProjectFilters) => {
    reset();
    const filtersToUse = filters || getCurrentFilters();
    return await fetchProjects(filtersToUse, 1);
  };

  // Initialize store - follows Pinia best practices for Nuxt
  const initialize = async (filters?: IProjectFilters) => {
    if (isInitialized.value && projects.value.length > 0) {
      return projects.value;
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

  const setStatusFilter = (
    status: "draft" | "in_progress" | "completed" | null
  ) => {
    statusFilter.value = status;
    debouncedSearch();
  };

  const setPage = async (page: number) => {
    await fetchProjects(getCurrentFilters(), page);
  };

  // Modal actions
  const openCreateModal = () => {
    selectedProject.value = undefined;
    showModal.value = true;
  };

  const openEditModal = (project: ProjectWithClient) => {
    selectedProject.value = project;
    showModal.value = true;
  };

  const closeModal = () => {
    showModal.value = false;
    selectedProject.value = undefined;
  };

  const openDeleteModal = (project: ProjectWithClient) => {
    projectToDelete.value = project;
    showDeleteModal.value = true;
  };

  const closeDeleteModal = () => {
    showDeleteModal.value = false;
    projectToDelete.value = null;
    deletionLoading.value = false;
  };

  // Navigation action
  const viewProject = (id: string) => {
    navigateTo(`/projects/${id}/setup-new`);
  };

  // CRUD actions
  const createProject = async (projectData: ProjectFormData) => {
    loading.value = true;
    error.value = null;

    try {
      const newProject = await projectService.createProject({
        title: projectData.title,
        description: projectData.description || null,
        client_id: projectData.client_id,
        status: projectData.status,
        initial_price: projectData.initial_price || null,
        require_password: projectData.require_password,
        bank_beneficiary: null,
        bank_bic: null,
        bank_iban: null,
        bank_transfer_reference: null,
        payment_completed_at: null,
        payment_method: null,
        payment_status: null,
        remaining_amount: null,
        stripe_payment_intent_id: null,
        stripe_session_id: null,
      });
      projects.value = [newProject, ...projects.value];
      closeModal();
      return newProject;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to create project");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateProject = async (
    id: string,
    updates: Partial<
      Pick<
        Project,
        "title" | "description" | "client_id" | "status" | "initial_price"
      >
    >
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const updatedProject = await projectService.updateProject(id, updates);
      const index = projects.value.findIndex((p) => p.id === id);
      if (index !== -1) {
        projects.value[index] = updatedProject;
      }
      closeModal();
      return updatedProject;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to update project");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteProject = async (id: string) => {
    deletionLoading.value = true;

    try {
      await projectService.deleteProject(id);
      projects.value = projects.value.filter((p) => p.id !== id);
      closeDeleteModal();
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete project");
      throw err;
    } finally {
      deletionLoading.value = false;
    }
  };

  const addProjectToList = (project: ProjectWithClient) => {
    projects.value = [project, ...projects.value];
  };

  const updateProjectInList = (updatedProject: ProjectWithClient) => {
    const index = projects.value.findIndex((p) => p.id === updatedProject.id);
    if (index !== -1) {
      projects.value[index] = updatedProject;
    }
  };

  return {
    // State
    projects: readonly(projects),
    loading: readonly(loading),
    error: readonly(error),
    isInitialized: readonly(isInitialized),

    // Pagination state
    currentPage,
    totalItems: readonly(totalItems),
    totalPages,

    // Filter state
    searchQuery,
    statusFilter,

    // Modal state
    showModal,
    selectedProject: readonly(selectedProject),
    showDeleteModal,
    projectToDelete: readonly(projectToDelete),
    deletionLoading: readonly(deletionLoading),

    // Getters
    filteredProjects,
    isLoading,
    hasError,
    statusOptions,

    // Actions
    reset,
    initialize,
    fetchProjects,
    refresh,

    // Filter actions
    setSearchQuery,
    setStatusFilter,
    setPage,

    // Modal actions
    openCreateModal,
    openEditModal,
    closeModal,
    openDeleteModal,
    closeDeleteModal,

    // Navigation
    viewProject,

    // CRUD actions
    createProject,
    updateProject,
    deleteProject,
    addProjectToList,
    updateProjectInList,
  };
});
