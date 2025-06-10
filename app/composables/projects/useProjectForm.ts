import { clientService } from "~/services/clientService";
import { projectService } from "~/services/projectService";
import type { Client } from "~/types/client";
import type { ProjectFormData, ProjectWithClient } from "~/types/project";
import { projectFormSchema } from "~/types/project";

export const useProjectForm = (initialProject?: ProjectWithClient) => {
  const toast = useToast();

  // Reactive state for UForm
  const state = reactive<Partial<ProjectFormData>>({
    title: initialProject?.title || "",
    description: initialProject?.description || "",
    client_id: initialProject?.client_id || "",
    status: initialProject?.status || "draft",
    initial_price: initialProject?.initial_price || null,
    password_expires_at: initialProject?.password_expires_at
      ? new Date(initialProject.password_expires_at).toISOString().slice(0, 16)
      : (() => {
          // Default to +30 days
          const defaultExpiration = new Date();
          defaultExpiration.setDate(defaultExpiration.getDate() + 30);
          return defaultExpiration.toISOString().slice(0, 16);
        })(),
    // password_hash est généré automatiquement par le service
  });

  // Client management
  const loadingClients = ref(false);
  const allClients = ref<Client[]>([]);

  // Computed values
  const isEditMode = computed(() => !!initialProject);

  // Client options for the select menu
  const clientOptions = computed(() =>
    allClients.value.map((client: Client) => ({
      value: client.id,
      label:
        client.type === "individual"
          ? `${client.first_name} ${client.last_name}`.trim()
          : client.company_name || "",
      description: client.billing_email,
    }))
  );

  // Load all clients for the user
  const loadAllClients = async () => {
    loadingClients.value = true;
    try {
      allClients.value = await clientService.getAllClients();
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.add({
        title: "Erreur",
        description: "Impossible de charger la liste des clients.",
        color: "error",
      });
    } finally {
      loadingClients.value = false;
    }
  };

  // Reset form state
  const resetForm = () => {
    // Set default expiration date to +30 days
    const defaultExpiration = new Date();
    defaultExpiration.setDate(defaultExpiration.getDate() + 30);

    Object.assign(state, {
      title: "",
      description: "",
      client_id: "",
      status: "draft",
      initial_price: null,
      password_expires_at: defaultExpiration.toISOString().slice(0, 16),
    });
  };

  // Submit handler for UForm
  const onSubmit = async (
    data: ProjectFormData
  ): Promise<ProjectWithClient | null> => {
    try {
      const formData = { ...data };

      // Convert datetime-local to ISO string if provided
      if (formData.password_expires_at) {
        formData.password_expires_at = new Date(
          formData.password_expires_at
        ).toISOString();
      }

      // Convert initial_price to number if it's a string
      if (typeof formData.initial_price === "string") {
        formData.initial_price = formData.initial_price
          ? parseFloat(formData.initial_price)
          : null;
      }

      // Ensure all undefined values are converted to null for DB compatibility
      const projectData = {
        title: formData.title,
        client_id: formData.client_id,
        status: formData.status,
        description: formData.description || null,
        initial_price: formData.initial_price || null,
        password_expires_at: formData.password_expires_at || null,
        // password_hash sont générés automatiquement par le service
      };

      let result: ProjectWithClient;

      if (isEditMode.value && initialProject) {
        result = await projectService.updateProject(
          initialProject.id,
          projectData
        );
        toast.add({
          title: "Projet modifié",
          description:
            "Les informations du projet ont été mises à jour avec succès.",
          color: "success",
        });
      } else {
        result = await projectService.createProject(projectData);
        toast.add({
          title: "Projet créé",
          description: "Le nouveau projet a été ajouté avec succès.",
          color: "success",
        });

        // Redirect to setup page for new projects
        setTimeout(() => {
          navigateTo(`/projects/${result.id}/setup`);
        }, 1000);
      }

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue";
      toast.add({
        title: "Erreur",
        description: message,
        color: "error",
      });
      return null;
    }
  };

  return {
    state,
    schema: projectFormSchema,
    isEditMode,
    loadingClients: readonly(loadingClients),
    clientOptions,
    allClients: readonly(allClients),
    loadAllClients,
    resetForm,
    onSubmit,
  };
};
