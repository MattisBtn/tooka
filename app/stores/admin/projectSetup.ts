import { defineStore } from "pinia";
import { projectService } from "~/services/projectService";
import type { ProjectWithClient } from "~/types/project";
import { formatDate, formatPrice, normalizeModule } from "~/utils/formatters";

export const useProjectSetupStore = defineStore("projectSetup", () => {
  const project = ref<ProjectWithClient | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  // Getters
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);
  const clientDisplayName = computed(() => {
    if (!project.value?.client) return "Client supprimé";
    const client = project.value.client;
    return client.type === "individual"
      ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
      : client.company_name || "";
  });

  const statusInfo = computed(() => {
    if (!project.value) return null;
    const statusOptions = projectService.getStatusOptions();
    return statusOptions.find((s) => s.value === project.value!.status);
  });

  const formattedPrice = computed(() =>
    formatPrice(project.value?.initial_price)
  );
  const formattedCreatedAt = computed(() =>
    formatDate(project.value?.created_at || "")
  );

  // Actions
  const fetchProject = async (projectId: string) => {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await projectService.getProjectById(projectId);
      project.value = data;
      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch project");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Check if project can be edited (all modules must be in draft status)
  const canEditProject = computed<boolean>(() => {
    if (!project.value) return false;

    // Normalize all modules and check if any is non-draft
    const modules = [
      normalizeModule(project.value.proposal),
      normalizeModule(project.value.moodboard),
      normalizeModule(project.value.selection),
      normalizeModule(project.value.gallery),
    ];

    const hasNonDraftModule = modules.some(
      (m) => m.exists && (m.status ?? "draft") !== "draft"
    );

    return !hasNonDraftModule;
  });

  // Edit project inline
  const updateProjectInline = async (updates: {
    title?: string;
    description?: string | null;
    client_id?: string;
    initial_price?: number | null;
    require_password?: boolean;
  }) => {
    if (!project.value || !canEditProject.value) {
      throw new Error(
        "Le projet ne peut pas être modifié car certaines étapes ne sont plus en brouillon"
      );
    }

    loading.value = true;
    error.value = null;

    try {
      const updatedProject = await projectService.updateProject(
        project.value.id,
        updates
      );
      // Merge shallowly with explicit cast to avoid excessive type instantiation
      project.value = {
        ...(project.value as ProjectWithClient),
        ...(updatedProject as Partial<ProjectWithClient>),
      } as ProjectWithClient;
      return updatedProject;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to update project");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const refreshProject = async () => {
    if (!project.value?.id) return;

    try {
      await fetchProject(project.value.id);
    } catch (err) {
      console.error("Error refreshing project:", err);
    }
  };

  // Check and update project status automatically
  const checkAndUpdateProjectStatus = async () => {
    if (!project.value?.id) return;

    try {
      const { projectService } = await import("~/services/projectService");
      await projectService.updateProjectStatusIfNeeded(project.value.id);
      // Refresh project data to get updated status
      await fetchProject(project.value.id);
    } catch (err) {
      console.error("Error updating project status:", err);
    }
  };

  return {
    project: readonly(project),
    loading: readonly(loading),
    error: readonly(error),
    isLoading,
    hasError,
    clientDisplayName,
    statusInfo,
    formattedPrice,
    formattedCreatedAt,
    canEditProject,
    fetchProject,
    updateProjectInline,
    refreshProject,
    checkAndUpdateProjectStatus,
  };
});
