import { MODULE_STATUS, StatusUtils } from '~/types/status';

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
  const statusItem = StatusUtils.getStatusItem(status as any);
  return statusItem?.label || status;
};

// Couleurs des statuts
export const getStatusColor = (
  status?: string
): "neutral" | "info" | "warning" | "success" => {
  const statusItem = StatusUtils.getStatusItem(status as any);
  const colorMap: Record<string, "neutral" | "info" | "warning" | "success"> = {
    gray: "neutral",
    blue: "info",
    orange: "warning",
    green: "success",
    yellow: "warning",
    red: "warning",
  };
  return colorMap[statusItem?.color || "gray"] || "neutral";
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
    MODULE_STATUS.AWAITING_CLIENT,
    MODULE_STATUS.REVISION_REQUESTED,
    MODULE_STATUS.COMPLETED,
    MODULE_STATUS.PAYMENT_PENDING,
  ].includes(status);
};

// Normalize module shape: can be null, single object, or an array of objects
// Returns whether it exists (non-empty) and its primary status if available
export const normalizeModule = (
  module: unknown
): { exists: boolean; status?: string } => {
  if (!module) return { exists: false };

  if (Array.isArray(module)) {
    if (module.length === 0) return { exists: false };
    const first = module[0] as unknown;
    const status = (() => {
      if (typeof first === "object" && first !== null) {
        const candidate = first as Record<string, unknown>;
        const value = candidate["status"];
        return typeof value === "string" ? value : undefined;
      }
      return undefined;
    })();
    return { exists: true, status };
  }

  if (typeof module === "object") {
    const candidate = module as Record<string, unknown>;
    const value = candidate["status"];
    const status = typeof value === "string" ? value : undefined;
    return { exists: true, status };
  }

  return { exists: false };
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
  const normalized = modules.map((m) => normalizeModule(m));
  const existing = normalized.filter((m) => m.exists);

  // If no modules exist, it's a new project
  if (existing.length === 0) return true;

  // If all existing modules are in draft (or missing status treated as draft), it's a new project
  return existing.every((m) => (m.status ?? MODULE_STATUS.DRAFT) === MODULE_STATUS.DRAFT);
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

  // Check if any module is advanced (this blocks access to lower steps)
  for (let i = 1; i <= 4; i++) {
    const moduleKey = moduleMap[i as keyof typeof moduleMap];
    const { exists, status } = normalizeModule(
      project[moduleKey as keyof typeof project]
    );

    if (exists && status && isAdvancedStatus(status)) {
      // If any step is advanced, only that step and higher steps are accessible
      return stepNumber < i;
    }
  }

  return false;
};

// Helper function to check if a step is locked because previous step is not completed
const isStepLockedByPreviousStep = (
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

  // For step 1, no previous step to check
  if (stepNumber === 1) return false;

  // If the project is new, do not lock by previous steps
  if (isNewProject(project)) return false;

  // Check if any step is in_progress (this blocks all navigation)
  for (let i = 1; i <= 4; i++) {
    const moduleKey = moduleMap[i as keyof typeof moduleMap];
    const { exists, status } = normalizeModule(
      project[moduleKey as keyof typeof project]
    );

    if (exists && status === MODULE_STATUS.AWAITING_CLIENT) {
      // If any step is in_progress, only that step is accessible
      return stepNumber !== i;
    }
  }

  // Check if we're trying to go to a lower step when all steps are completed
  const allStepsCompleted = [1, 2, 3, 4].every((i) => {
    const moduleKey = moduleMap[i as keyof typeof moduleMap];
    const { exists, status } = normalizeModule(
      project[moduleKey as keyof typeof project]
    );
    return exists && status === MODULE_STATUS.COMPLETED;
  });

  if (allStepsCompleted) {
    // If all steps are completed, you can only go to higher steps
    return stepNumber < 4; // Only step 4 is accessible
  }

  // Find the last completed step
  let lastCompletedStep = 0;

  for (let i = 1; i <= 4; i++) {
    const moduleKey = moduleMap[i as keyof typeof moduleMap];
    const { exists, status } = normalizeModule(
      project[moduleKey as keyof typeof project]
    );

    if (exists && status === MODULE_STATUS.COMPLETED) {
      lastCompletedStep = i;
    }
  }

  // If we have completed steps, allow access to all subsequent steps
  if (lastCompletedStep > 0) {
    return stepNumber <= lastCompletedStep; // Only lock steps before or equal to last completed
  }

  // If no previous step is completed, this step is locked
  return true;
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
  const normalized = normalizeModule(project[moduleKey]);

  // Check if this is a new project
  const isNew = isNewProject(project);

  // Check if step is locked by advanced modules
  const isLocked = isStepLockedByAdvancedModules(stepNumber, project);

  // Check if step is locked because previous step is not completed
  const isLockedByPrevious = isStepLockedByPreviousStep(stepNumber, project);

  // Module doesn't exist
  if (!normalized.exists) {
    return {
      status: isNew
        ? "not_started"
        : isLocked || isLockedByPrevious
        ? "locked"
        : "not_started",
      canView: !isLockedByPrevious, // Can't view if locked by previous step
      canEdit: !isLocked && !isLockedByPrevious, // Can edit if not locked by either condition
      moduleExists: false,
    };
  }

  // Module exists, check status
  const moduleStatus = normalized.status as string | undefined;
  const isAdvanced = moduleStatus ? isAdvancedStatus(moduleStatus) : false;

  if (moduleStatus === MODULE_STATUS.COMPLETED) {
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
    status: isLocked || isLockedByPrevious ? "locked" : "in_progress",
    canView: !isLockedByPrevious, // Can't view if locked by previous step
    canEdit: !isLocked && !isLockedByPrevious, // Can edit if not locked by either condition
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
