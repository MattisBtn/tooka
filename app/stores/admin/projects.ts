import { defineStore } from "pinia";
import { projectService } from "~/services/projectService";
import type {
  IProjectFilters,
  ProjectFormData,
  ProjectWithClient,
} from "~/types/project";

export const useProjectsStore = defineStore("projects", () => {
  // Core State
  const projects = ref<ProjectWithClient[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const isInitialized = ref(false);

  // Pagination State
  const currentPage = ref(1);
  const totalItems = ref(0);
  const itemsPerPage = 20;

  // Filter State
  const searchQuery = ref("");
  const statusFilter = ref<"draft" | "in_progress" | "completed" | null>(null);
  const sortOrder = ref<
    | "title_asc"
    | "title_desc"
    | "created_asc"
    | "created_desc"
    | "status_asc"
    | "status_desc"
  >("created_desc");

  // Simplified Modal State (YAGNI/KISS)
  const modalState = ref<{
    type: "create" | "edit" | "delete" | "multiple-delete" | null;
    data?: ProjectWithClient | ProjectWithClient[];
  }>({ type: null });

  // Loading States
  const deletionLoading = ref(false);
  const multipleDeletionLoading = ref(false);

  // Filter Helpers
  const getCurrentFilters = (): IProjectFilters => ({
    search: searchQuery.value.trim() || undefined,
    status: statusFilter.value || undefined,
    sort: sortOrder.value,
  });

  // Essential Computed Only (YAGNI/KISS)
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage));

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
      const pagination = { page, pageSize: itemsPerPage };
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

  const initialize = async (filters?: IProjectFilters) => {
    if (isInitialized.value) return;
    return await refresh(filters);
  };

  // Search & Filter Actions
  const debouncedSearch = useDebounceFn(async () => {
    await refresh(getCurrentFilters());
  }, 300);

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

  const setSortOrder = (
    order:
      | "title_asc"
      | "title_desc"
      | "created_asc"
      | "created_desc"
      | "status_asc"
      | "status_desc"
  ) => {
    sortOrder.value = order;
    debouncedSearch();
  };

  const setPage = async (page: number) => {
    await fetchProjects(getCurrentFilters(), page);
  };

  // Simplified Modal Management (YAGNI/KISS)
  const openCreateModal = () => {
    modalState.value = { type: "create" };
  };

  const openEditModal = (project: ProjectWithClient) => {
    modalState.value = { type: "edit", data: project };
  };

  const closeModal = () => {
    modalState.value = { type: null };
  };

  const openDeleteModal = (project: ProjectWithClient) => {
    modalState.value = { type: "delete", data: project };
  };

  const openMultipleDeleteModal = (selectedProjects: ProjectWithClient[]) => {
    modalState.value = { type: "multiple-delete", data: selectedProjects };
  };

  // Navigation action
  const viewProject = (id: string) => {
    navigateTo(`/projects/${id}/setup`);
  };

  // CRUD Operations
  const createProject = async (projectData: ProjectFormData) => {
    loading.value = true;
    error.value = null;

    try {
      const newProject = await projectService.createProject({
        title: projectData.title,
        description: projectData.description || null,
        client_id: projectData.client_id,
        status: projectData.status,
        require_password: projectData.require_password,
        completed_at: null,
        remaining_amount: null,
        payment_method: null,
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
    updates: Partial<ProjectFormData>
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
      closeModal();
      return { resetSelection: true };
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete project");
      throw err;
    } finally {
      deletionLoading.value = false;
    }
  };

  const deleteMultipleProjects = async () => {
    const projectsToDelete = modalState.value.data as ProjectWithClient[];
    if (!projectsToDelete?.length) return;

    multipleDeletionLoading.value = true;
    error.value = null;

    try {
      const ids = projectsToDelete.map((project) => project.id);
      const result = await projectService.deleteMultipleProjects(ids);

      if (result.success.length > 0) {
        projects.value = projects.value.filter(
          (project) => !result.success.includes(project.id)
        );
      }

      if (result.success.length > 0 && result.failed.length === 0) {
        closeModal();
        return { resetSelection: true };
      } else if (result.success.length > 0 && result.failed.length > 0) {
        const errorMessage = `Suppression partielle : ${
          result.success.length
        } projet(s) supprimé(s), ${
          result.failed.length
        } échec(s). Erreurs : ${result.errors.join(", ")}`;
        error.value = new Error(errorMessage);
        closeModal();
        return { resetSelection: true };
      } else {
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
          : new Error("Failed to delete multiple projects");
      closeModal();
    } finally {
      multipleDeletionLoading.value = false;
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
    projects: projects,
    loading: loading,
    error: error,
    isInitialized: isInitialized,

    // Pagination State
    currentPage,
    totalItems: totalItems,
    totalPages,

    // Filter State
    searchQuery,
    statusFilter,
    sortOrder,

    // Modal State
    modalState: modalState,
    deletionLoading: deletionLoading,
    multipleDeletionLoading: multipleDeletionLoading,

    // Actions
    reset,
    initialize,
    fetchProjects,
    refresh,
    setSearchQuery,
    setStatusFilter,
    setSortOrder,
    setPage,
    openCreateModal,
    openEditModal,
    closeModal,
    openDeleteModal,
    openMultipleDeleteModal,
    viewProject,
    createProject,
    updateProject,
    deleteProject,
    deleteMultipleProjects,
    addProjectToList,
    updateProjectInList,
  };
});
