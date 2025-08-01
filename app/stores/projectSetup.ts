import { defineStore } from "pinia";
import { projectService } from "~/services/projectService";
import type { ProjectWithClient } from "~/types/project";
import { formatDate, formatPrice, getStatusLabel } from "~/utils/formatters";

export const useProjectSetupStore = defineStore("projectSetup", () => {
  const project = ref<ProjectWithClient | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const modules = ref({
    proposal: {
      enabled: false,
      completed: false,
      summary: null as string | null,
    },
    moodboard: {
      enabled: false,
      completed: false,
      summary: null as string | null,
    },
    selection: {
      enabled: false,
      completed: false,
      summary: null as string | null,
    },
    gallery: {
      enabled: false,
      completed: false,
      summary: null as string | null,
    },
  });

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
  const reset = () => {
    project.value = null;
    loading.value = false;
    error.value = null;
    modules.value = {
      proposal: { enabled: false, completed: false, summary: null },
      moodboard: { enabled: false, completed: false, summary: null },
      selection: { enabled: false, completed: false, summary: null },
      gallery: { enabled: false, completed: false, summary: null },
    };
  };

  const fetchProject = async (projectId: string) => {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await projectService.getProjectById(projectId);
      project.value = data;
      updateModuleStatesFromProject(data);
      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch project");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const extractProposalTitle = (content_json: unknown): string => {
    if (!content_json || !Array.isArray(content_json)) return "Proposition";
    const titleComponent = content_json.find((comp: unknown) => {
      const component = comp as { type?: string; content?: string };
      return component.type === "title";
    });
    const component = titleComponent as { content?: string } | undefined;
    return component?.content || "Proposition";
  };

  const updateModuleStatesFromProject = (projectData: ProjectWithClient) => {
    // Proposal
    if (projectData.proposal) {
      modules.value.proposal.enabled = true;
      modules.value.proposal.completed = true;
      const proposalTitle = extractProposalTitle(
        projectData.proposal.content_json
      );
      modules.value.proposal.summary = `Proposition "${proposalTitle}" (${getStatusLabel(
        projectData.proposal.status,
        "proposal"
      )})`;
    } else {
      modules.value.proposal.completed = false;
      modules.value.proposal.summary = null;
    }

    // Moodboard
    if (projectData.moodboard) {
      modules.value.moodboard.enabled = true;
      modules.value.moodboard.completed = true;
      modules.value.moodboard.summary = `Moodboard "${
        projectData.moodboard.title
      }" (${getStatusLabel(projectData.moodboard.status, "moodboard")})`;
    } else {
      modules.value.moodboard.completed = false;
      modules.value.moodboard.summary = null;
    }

    // Selection
    if (projectData.selection) {
      modules.value.selection.enabled = true;
      modules.value.selection.completed = true;
      modules.value.selection.summary = `Sélection de ${
        projectData.selection.max_media_selection
      } média${
        projectData.selection.max_media_selection > 1 ? "s" : ""
      } (${getStatusLabel(projectData.selection.status, "selection")})`;
    } else {
      modules.value.selection.completed = false;
      modules.value.selection.summary = null;
    }

    // Gallery
    if (projectData.gallery) {
      modules.value.gallery.enabled = true;
      modules.value.gallery.completed = true;
      modules.value.gallery.summary = `Galerie (${getStatusLabel(
        projectData.gallery.status,
        "gallery"
      )})`;
    } else {
      modules.value.gallery.completed = false;
      modules.value.gallery.summary = null;
    }
  };

  const updateModuleState = (
    moduleName: keyof typeof modules.value,
    updates: Partial<{
      enabled: boolean;
      completed: boolean;
      summary: string | null;
    }>
  ) => {
    Object.assign(modules.value[moduleName], updates);
  };

  return {
    project: readonly(project),
    loading: readonly(loading),
    error: readonly(error),
    modules,
    isLoading,
    hasError,
    clientDisplayName,
    statusInfo,
    formattedPrice,
    formattedCreatedAt,
    reset,
    fetchProject,
    updateModuleState,
  };
});
