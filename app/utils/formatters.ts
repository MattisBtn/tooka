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

// Step status utilities
export type StepStatus = "locked" | "in_progress" | "completed";

export interface StepInfo {
  status: StepStatus;
  canView: boolean;
  canEdit: boolean;
  moduleExists: boolean;
  moduleStatus?: string;
}

// Determine step status based on project modules
export const getStepStatus = (
  stepNumber: 1 | 2 | 3 | 4,
  project: {
    proposal?: { status: string } | null;
    moodboard?: { status: string } | null;
    selection?: { status: string } | null;
    gallery?: { status: string } | null;
  }
): StepInfo => {
  const moduleMap = {
    1: "proposal",
    2: "moodboard",
    3: "selection",
    4: "gallery",
  } as const;

  const moduleKey = moduleMap[stepNumber];
  const module = project[moduleKey];

  // Module doesn't exist
  if (!module) {
    return {
      status: "locked",
      canView: true,
      canEdit: false,
      moduleExists: false,
    };
  }

  // Module exists, check status
  const moduleStatus = module.status;

  if (moduleStatus === "completed") {
    return {
      status: "completed",
      canView: true,
      canEdit: true,
      moduleExists: true,
      moduleStatus,
    };
  }

  // Module exists but not completed
  return {
    status: "in_progress",
    canView: true,
    canEdit: true,
    moduleExists: true,
    moduleStatus,
  };
};

// Get all steps status for a project
export const getProjectStepsStatus = (project: {
  proposal?: { status: string } | null;
  moodboard?: { status: string } | null;
  selection?: { status: string } | null;
  gallery?: { status: string } | null;
}): Record<1 | 2 | 3 | 4, StepInfo> => {
  return {
    1: getStepStatus(1, project),
    2: getStepStatus(2, project),
    3: getStepStatus(3, project),
    4: getStepStatus(4, project),
  };
};
