import { defineStore } from "pinia";
import { normalizeModule } from "~/composables/projects/useProjectSteps";
import { projectService } from "~/services/projectService";
import type { Project, ProjectWithClient } from "~/types/project";
import { formatDate, formatPrice } from "~/utils/formatters";

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

  // Project completion state
  const isProjectCompleted = computed<boolean>(() => {
    return project.value?.status === "completed";
  });

  // Check if project is free (no initial price or price is 0)
  const isFree = computed<boolean>(() => {
    return !project.value?.initial_price || project.value.initial_price === 0;
  });

  // Actions
  const reset = () => {
    project.value = null;
    loading.value = false;
    error.value = null;

    useMoodboardStore().reset();
    useSelectionStore().reset();
    useGalleryStore().reset();
  };

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
      normalizeModule(project.value.moodboard),
      normalizeModule(project.value.selection),
      normalizeModule(project.value.gallery),
    ];

    const hasNonDraftModule = modules.some(
      (m) => m.exists && (m.status ?? "draft") !== "draft"
    );

    return !hasNonDraftModule;
  });

  const refreshProject = async () => {
    if (!project.value?.id) return;

    try {
      await fetchProject(project.value.id);
    } catch (err) {
      console.error("Error refreshing project:", err);
    }
  };

  // Optimistic update for project data
  const updateProject = (updates: Partial<Project>) => {
    if (!project.value) return;

    project.value = {
      ...project.value,
      ...updates,
    };
  };

  // Optimistic update for project modules (moodboard, selection, gallery)
  const updateProjectModule = async (
    moduleKey: "moodboard" | "selection" | "gallery",
    moduleData: unknown
  ) => {
    if (!project.value) return;

    // Create new project object with updated module
    const updatedProject = {
      ...project.value,
      [moduleKey]: moduleData,
    };

    // Update project reference
    project.value = updatedProject;

    // Determine new project status
    const newStatus = projectService.determineProjectStatus({
      moodboard: updatedProject.moodboard,
      selection: updatedProject.selection,
      gallery: updatedProject.gallery,
    });

    // Update project status if it changed
    if (newStatus !== updatedProject.status) {
      try {
        await projectService.updateProjectStatus(updatedProject.id, newStatus);
        project.value = {
          ...updatedProject,
          status: newStatus,
        };
      } catch (err) {
        console.error("Error updating project status:", err);
      }
    }
  };

  return {
    project: readonly(project),
    loading: readonly(loading),
    error: readonly(error),
    isLoading,
    hasError,
    isProjectCompleted,
    isFree,
    clientDisplayName,
    statusInfo,
    formattedPrice,
    formattedCreatedAt,
    canEditProject,
    reset,
    fetchProject,
    refreshProject,
    updateProject,
    updateProjectModule,
  };
});
