// Formatage des prix
export const formatPrice = (price: number | null | undefined): string => {
  if (!price) return "Non défini";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
};

// Formatage des dates
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

// Labels des statuts
export const getStatusLabel = (
  status: string,
  type: "proposal" | "moodboard" | "selection" | "gallery"
): string => {
  const statusMap = {
    draft: "Brouillon",
    awaiting_client: "En attente client",
    revision_requested: "Révision demandée",
    completed:
      type === "moodboard"
        ? "Validé"
        : type === "selection"
        ? "Validée"
        : "Acceptée",
    payment_pending: "Paiement en attente",
  };
  return statusMap[status as keyof typeof statusMap] || status;
};
