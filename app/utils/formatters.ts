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

// Formatage des dates relatives avec Intl.RelativeTimeFormat
export const formatRelativeDate = (dateString: string | null): string => {
  if (!dateString) return "Date inconnue";

  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  const rtf = new Intl.RelativeTimeFormat("fr", {
    numeric: "auto",
    style: "short",
  });

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "À l'instant";
  } else if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, "minute");
  } else if (diffInHours < 24) {
    return rtf.format(-diffInHours, "hour");
  } else if (diffInDays < 7) {
    return rtf.format(-diffInDays, "day");
  } else {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  }
};

// Labels des statuts
export const getStatusLabel = (
  status: string,
  _type?: "proposal" | "moodboard" | "selection" | "gallery"
): string => {
  const statusMap = {
    draft: "Brouillon",
    awaiting_client: "En attente client",
    revision_requested: "Révision demandée",
    completed: "Acceptée",
    payment_pending: "Paiement en attente",
  };
  return statusMap[status as keyof typeof statusMap] || status;
};

// Couleurs des statuts
export const getStatusColor = (
  status?: string
): "neutral" | "info" | "warning" | "success" => {
  const colorMap: Record<string, "neutral" | "info" | "warning" | "success"> = {
    draft: "neutral",
    awaiting_client: "info",
    revision_requested: "warning",
    completed: "success",
    payment_pending: "info",
  };
  return colorMap[status || "draft"] || "neutral";
};
