export const useClientSelect = () => {
  const {
    data: clients,
    pending,
    error,
    refresh,
  } = useAsyncData(
    "clients-select",
    async () => {
      const { clientService } = await import("~/services/clientService");
      return await clientService.getAllClients();
    },
    {
      server: false,
      lazy: true,
      default: () => [],
    }
  );

  const clientOptions = computed(() =>
    clients.value.map((client) => ({
      value: client.id,
      label:
        client.type === "individual"
          ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
          : client.company_name || "",
    }))
  );

  return {
    clients: readonly(clients),
    clientOptions,
    pending,
    error,
    refresh,
  };
};
