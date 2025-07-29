import { clientService } from "~/services/clientService";
import type { Client } from "~/types/client";
import type { ProjectFormData, ProjectWithClient } from "~/types/project";
import { projectFormSchema } from "~/types/project";

export const useProjectForm = (initialProject?: ProjectWithClient) => {
  const toast = useToast();
  const store = useProjectsStore();

  // Reactive state for UForm
  const state = reactive<Partial<ProjectFormData>>({
    title: initialProject?.title || "",
    description: initialProject?.description || "",
    client_id: initialProject?.client_id || "",
    status: initialProject?.status || "draft",
    initial_price: initialProject?.initial_price || null,
    require_password: initialProject?.password_hash ? true : false,
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
    Object.assign(state, {
      title: "",
      description: "",
      client_id: "",
      status: "draft",
      initial_price: null,
      require_password: false,
    });
  };

  // Submit handler for UForm
  const onSubmit = async (
    data: ProjectFormData
  ): Promise<ProjectWithClient | null> => {
    try {
      const formData = { ...data };

      // Convert initial_price to number if it's a string
      if (typeof formData.initial_price === "string") {
        formData.initial_price = formData.initial_price
          ? parseFloat(formData.initial_price)
          : null;
      }

      // Ensure all undefined values are converted to null for DB compatibility
      const projectData: ProjectFormData = {
        title: formData.title,
        client_id: formData.client_id,
        status: formData.status,
        description: formData.description || null,
        initial_price: formData.initial_price || null,
        require_password: formData.require_password || false,
      };

      let result: ProjectWithClient;

      if (isEditMode.value && initialProject) {
        const { require_password, ...updateData } = projectData;
        result = await store.updateProject(initialProject.id, updateData);
        toast.add({
          title: "Projet modifié",
          description:
            "Les informations du projet ont été mises à jour avec succès.",
          color: "success",
        });
      } else {
        // Utiliser le store pour créer le projet
        result = await store.createProject(projectData);

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
