import type { Client, ClientFormData } from "~/types/client";
import { clientFormSchema } from "~/types/client";

export const useClientForm = (initialClient?: Client) => {
  const toast = useToast();
  const store = useClientsStore();

  // Reactive state for UForm - no longer readonly
  const state = reactive<Partial<ClientFormData>>({
    type: initialClient?.type || "individual",
    first_name: initialClient?.first_name || "",
    last_name: initialClient?.last_name || "",
    company_name: initialClient?.company_name || "",
    billing_email: initialClient?.billing_email || "",
    billing_address: initialClient?.billing_address || "",
    billing_city: initialClient?.billing_city || "",
    billing_country: initialClient?.billing_country || "",
    billing_postal: initialClient?.billing_postal || "",
    billing_phone: initialClient?.billing_phone || "",
    siret: initialClient?.siret || "",
    tax_id: initialClient?.tax_id || "",
    iban: initialClient?.iban || "",
    bic: initialClient?.bic || "",
    notes: initialClient?.notes || "",
  });

  // Computed values
  const isIndividual = computed(() => state.type === "individual");
  const isCompany = computed(() => state.type === "company");
  const isEditMode = computed(() => !!initialClient);

  // Reset form state
  const resetForm = () => {
    Object.assign(state, {
      type: "individual",
      first_name: "",
      last_name: "",
      company_name: "",
      billing_email: "",
      billing_address: "",
      billing_city: "",
      billing_country: "",
      billing_postal: "",
      billing_phone: "",
      siret: "",
      tax_id: "",
      iban: "",
      bic: "",
      notes: "",
    });
  };

  // Handle type change
  const changeClientType = (newType: "individual" | "company") => {
    state.type = newType;

    // Clear type-specific fields when switching
    if (newType === "individual") {
      state.company_name = "";
      state.siret = "";
      state.tax_id = "";
      state.iban = "";
      state.bic = "";
    } else {
      state.first_name = "";
      state.last_name = "";
    }
  };

  // Submit handler for UForm
  const onSubmit = async (data: ClientFormData): Promise<Client | null> => {
    try {
      const clientData = {
        ...data,
        billing_phone: data.billing_phone || null,
        siret: data.siret || null,
        tax_id: data.tax_id || null,
        iban: data.iban || null,
        bic: data.bic || null,
        notes: data.notes || null,
        company_name: data.company_name || null,
        first_name: data.first_name || null,
        last_name: data.last_name || null,
      };

      let result: Client;

      if (isEditMode.value && initialClient) {
        result = await store.updateClient(initialClient.id, clientData);
        toast.add({
          title: "Client modifié",
          description:
            "Les informations du client ont été mises à jour avec succès.",
          color: "success",
        });
      } else {
        result = await store.createClient(
          clientData as Omit<Client, "id" | "created_at" | "updated_at">
        );
        toast.add({
          title: "Client créé",
          description: "Le nouveau client a été ajouté avec succès.",
          color: "success",
        });
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
    schema: clientFormSchema,
    isIndividual,
    isCompany,
    isEditMode,
    resetForm,
    changeClientType,
    onSubmit,
  };
};
