import { defineStore } from "pinia";
import { projectService } from "~/services/projectService";
import type { Json } from "~/types/database.types";
import type { ProjectWithClient } from "~/types/project";

export const useProjectStore = defineStore("project", () => {
  // State
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const project = ref<ProjectWithClient | null>(null);

  // Module states
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

  // Helper function to extract title from proposal content_json
  const extractProposalTitle = (content_json: Json): string => {
    if (!content_json || !Array.isArray(content_json)) return "Proposition";

    const titleComponent = content_json.find((comp: unknown) => {
      const component = comp as { type?: string; content?: string };
      return component.type === "title";
    });

    const component = titleComponent as { content?: string } | undefined;
    return component?.content || "Proposition";
  };

  // Update module states based on project data
  const updateModuleStatesFromProject = async (
    projectData: ProjectWithClient
  ) => {
    // Update proposal module state
    if (projectData.proposal) {
      modules.value.proposal.enabled = true;
      modules.value.proposal.completed = true;
      const proposalTitle = extractProposalTitle(
        projectData.proposal.content_json
      );
      modules.value.proposal.summary = `Proposition "${proposalTitle}" (${getProposalStatusLabel(
        projectData.proposal.status
      )})`;
    } else {
      // Keep enabled state but mark as not completed if no proposal exists
      modules.value.proposal.completed = false;
      modules.value.proposal.summary = null;
    }

    // Update moodboard module state
    if (projectData.moodboard) {
      modules.value.moodboard.enabled = true;
      modules.value.moodboard.completed = true;
      modules.value.moodboard.summary = `Moodboard "${
        projectData.moodboard.title
      }" (${getMoodboardStatusLabel(projectData.moodboard.status)})`;
    } else {
      // Keep enabled state but mark as not completed if no moodboard exists
      modules.value.moodboard.completed = false;
      modules.value.moodboard.summary = null;
    }

    // Update selection module state
    if (projectData.selection) {
      modules.value.selection.enabled = true;
      modules.value.selection.completed = true;
      modules.value.selection.summary = `Sélection de ${
        projectData.selection.max_media_selection
      } média${
        projectData.selection.max_media_selection > 1 ? "s" : ""
      } (${getSelectionStatusLabel(projectData.selection.status)})`;
    } else {
      // Keep enabled state but mark as not completed if no selection exists
      modules.value.selection.completed = false;
      modules.value.selection.summary = null;
    }

    // Update gallery module state
    if (projectData.gallery) {
      modules.value.gallery.enabled = true;
      modules.value.gallery.completed = true;
      modules.value.gallery.summary = `Galerie (${getGalleryStatusLabel(
        projectData.gallery.status
      )})`;
    } else {
      // Keep enabled state but mark as not completed if no gallery exists
      modules.value.gallery.completed = false;
      modules.value.gallery.summary = null;
    }
  };

  // Get proposal status label
  const getProposalStatusLabel = (status: string) => {
    const statusMap = {
      draft: "Brouillon",
      awaiting_client: "En attente client",
      revision_requested: "Révision demandée",
      completed: "Acceptée",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // Get moodboard status label
  const getMoodboardStatusLabel = (status: string) => {
    const statusMap = {
      draft: "Brouillon",
      awaiting_client: "En attente client",
      revision_requested: "Révision demandée",
      completed: "Validé",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // Get selection status label
  const getSelectionStatusLabel = (status: string) => {
    const statusMap = {
      draft: "Brouillon",
      awaiting_client: "En attente client",
      revision_requested: "Révision demandée",
      completed: "Validée",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // Get gallery status label
  const getGalleryStatusLabel = (status: string) => {
    const statusMap = {
      draft: "Brouillon",
      awaiting_client: "En attente client",
      revision_requested: "Révision demandée",
      completed: "Acceptée",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // Update module completion state
  const updateModuleState = (
    moduleName: keyof typeof modules.value,
    updates: Partial<(typeof modules.value)[keyof typeof modules.value]>
  ) => {
    Object.assign(modules.value[moduleName], updates);
  };

  // Fetch project details
  const fetchProject = async (projectId: string) => {
    if (!projectId) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await projectService.getProjectById(projectId);
      project.value = data;

      // Update module states based on project data
      await updateModuleStatesFromProject(data);

      return data;
    } catch (err) {
      console.error("Error fetching project:", err);
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch project");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Get client display name
  const clientDisplayName = computed(() => {
    if (!project.value?.client) return "Client supprimé";

    const client = project.value.client;
    return client.type === "individual"
      ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
      : client.company_name || "";
  });

  // Get project status info
  const statusInfo = computed(() => {
    if (!project.value) return null;

    const statusOptions = projectService.getStatusOptions();
    return statusOptions.find((s) => s.value === project.value!.status);
  });

  // Format price
  const formattedPrice = computed(() => {
    if (!project.value?.initial_price) return "Non défini";

    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(project.value.initial_price);
  });

  // Format dates
  const formattedCreatedAt = computed(() => {
    if (!project.value?.created_at) return "";

    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(project.value.created_at));
  });

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    project: readonly(project),
    modules,

    // Computed
    clientDisplayName,
    statusInfo,
    formattedPrice,
    formattedCreatedAt,

    // Actions
    fetchProject,
    updateModuleState,
  };
});
