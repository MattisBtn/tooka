import { projectService } from "~/services/projectService";
import type {
  IProjectFilters,
  Project,
  ProjectWithClient,
} from "~/types/project";

export const useProjects = () => {
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const projects = ref<ProjectWithClient[]>([]);
  const hasMore = ref(true);
  const skip = ref(0);
  const pageSize = 20;
  const currentFilters = ref<IProjectFilters>({});

  // Reset all states
  const reset = () => {
    projects.value = [];
    hasMore.value = true;
    skip.value = 0;
    error.value = null;
  };

  // Fetch projects with pagination and optional filters
  const fetchProjects = async (
    filters: IProjectFilters = {},
    isInitialLoad = false
  ) => {
    if (loading.value) return;

    // For initial load, always allow the request
    if (!isInitialLoad && !hasMore.value) return;

    loading.value = true;
    error.value = null;

    try {
      const pagination = {
        page: Math.floor(skip.value / pageSize) + 1,
        pageSize,
      };
      const data = await projectService.getProjects(filters, pagination);

      if (data.length < pageSize) {
        hasMore.value = false;
      }

      projects.value = isInitialLoad ? data : [...projects.value, ...data];
      skip.value += pageSize;

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch projects");
      console.error("Error fetching projects:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Load more data (for infinite scrolling)
  const loadMore = async (filters?: IProjectFilters) => {
    const filtersToUse = filters || currentFilters.value;
    return await fetchProjects(filtersToUse, false);
  };

  // Initial load with proper reset
  const initialLoad = async (filters: IProjectFilters = {}) => {
    reset();
    currentFilters.value = { ...filters };
    return await fetchProjects(filters, true);
  };

  // Refresh with current filters (useful for search/filter changes)
  const refresh = async (filters: IProjectFilters = {}) => {
    reset();
    currentFilters.value = { ...filters };
    return await fetchProjects(filters, true);
  };

  // Create a new project
  const createProject = async (
    projectData: Omit<
      Project,
      | "id"
      | "created_at"
      | "updated_at"
      | "user_id"
      | "password_hash"
      | "password_expires_at"
    > & {
      require_password?: boolean;
    }
  ): Promise<ProjectWithClient> => {
    loading.value = true;
    error.value = null;

    try {
      const newProject = await projectService.createProject(projectData);
      // Convert Project to ProjectWithClient for consistency
      const projectWithClient: ProjectWithClient = {
        ...newProject,
        client: undefined, // Will be populated when list is refreshed
      };
      projects.value = [projectWithClient, ...projects.value];
      return projectWithClient;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to create project");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Update a project
  const updateProject = async (id: string, updates: Partial<Project>) => {
    loading.value = true;
    error.value = null;

    try {
      const updatedProject = await projectService.updateProject(id, updates);
      const index = projects.value.findIndex((p) => p.id === id);
      if (index !== -1) {
        projects.value[index] = updatedProject;
      }
      return updatedProject;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to update project");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete a project
  const deleteProject = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      await projectService.deleteProject(id);
      projects.value = projects.value.filter((p) => p.id !== id);
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete project");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Add project to local list (for real-time updates)
  const addProjectToList = (project: ProjectWithClient) => {
    projects.value = [project, ...projects.value];
  };

  // Update project in local list (for real-time updates)
  const updateProjectInList = (updatedProject: ProjectWithClient) => {
    const index = projects.value.findIndex((p) => p.id === updatedProject.id);
    if (index !== -1) {
      projects.value[index] = updatedProject;
    }
  };

  // Get project status options
  const getStatusOptions = () => projectService.getStatusOptions();

  return {
    // State
    projects: readonly(projects),
    loading: readonly(loading),
    error: readonly(error),
    hasMore: readonly(hasMore),
    skip: readonly(skip),

    // Actions
    fetchProjects,
    loadMore,
    initialLoad,
    refresh,
    createProject,
    updateProject,
    deleteProject,
    addProjectToList,
    updateProjectInList,
    reset,
    getStatusOptions,
  };
};
