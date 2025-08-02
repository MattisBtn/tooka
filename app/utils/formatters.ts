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

// Step status utilities
export type StepStatus = "locked" | "in_progress" | "completed" | "not_started";

export interface StepInfo {
  status: StepStatus;
  canView: boolean;
  canEdit: boolean;
  moduleExists: boolean;
  moduleStatus?: string;
}

// Helper function to determine if a status is advanced (non-draft)
const isAdvancedStatus = (status: string): boolean => {
  return [
    "awaiting_client",
    "revision_requested",
    "completed",
    "payment_pending",
  ].includes(status);
};

// Helper function to check if project is new (all modules in draft or don't exist)
const isNewProject = (project: {
  proposal?: { status: string } | null;
  moodboard?: { status: string } | null;
  selection?: { status: string } | null;
  gallery?: { status: string } | null;
}): boolean => {
  const modules = [
    project.proposal,
    project.moodboard,
    project.selection,
    project.gallery,
  ];
  const existingModules = modules.filter(Boolean);

  // If no modules exist, it's a new project
  if (existingModules.length === 0) return true;

  // If all existing modules are in draft, it's a new project
  return existingModules.every((module) => module?.status === "draft");
};

// Helper function to check if a step is locked due to advanced modules
const isStepLockedByAdvancedModules = (
  stepNumber: 1 | 2 | 3 | 4,
  project: {
    proposal?: { status: string } | null;
    moodboard?: { status: string } | null;
    selection?: { status: string } | null;
    gallery?: { status: string } | null;
  }
): boolean => {
  const moduleMap = {
    1: "proposal",
    2: "moodboard",
    3: "selection",
    4: "gallery",
  } as const;

  // Check if any module after the current step is advanced
  for (let i = stepNumber + 1; i <= 4; i++) {
    const moduleKey = moduleMap[i as keyof typeof moduleMap];
    const module = project[moduleKey as keyof typeof project];

    if (module && isAdvancedStatus(module.status)) {
      return true; // This step is locked because a later step is advanced
    }
  }

  return false;
};

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

  // Check if this is a new project
  const isNew = isNewProject(project);

  // Check if step is locked by advanced modules
  const isLocked = isStepLockedByAdvancedModules(stepNumber, project);

  // Module doesn't exist
  if (!module) {
    return {
      status: isNew ? "not_started" : isLocked ? "locked" : "not_started",
      canView: true,
      canEdit: !isLocked, // Can edit if not locked
      moduleExists: false,
    };
  }

  // Module exists, check status
  const moduleStatus = module.status;
  const isAdvanced = isAdvancedStatus(moduleStatus);

  if (moduleStatus === "completed") {
    return {
      status: "completed",
      canView: true,
      canEdit: false, // Completed modules cannot be edited
      moduleExists: true,
      moduleStatus,
    };
  }

  if (isAdvanced) {
    return {
      status: "in_progress",
      canView: true,
      canEdit: false, // Advanced modules cannot be edited
      moduleExists: true,
      moduleStatus,
    };
  }

  // Module is in draft
  return {
    status: isLocked ? "locked" : "in_progress",
    canView: true,
    canEdit: !isLocked, // Can edit if not locked by advanced modules
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
