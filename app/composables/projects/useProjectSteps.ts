// Normalize module shape: can be null, single object, or an array of objects

import type { StepInfo, WorkflowStep } from "~/types/project";

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

// Corrected logic to determine if a step is accessible
const isStepAccessible = (
  stepNumber: WorkflowStep,
  project: {
    proposal?: { status: string } | null;
    moodboard?: { status: string } | null;
    selection?: { status: string } | null;
    gallery?: { status: string } | null;
  }
): boolean => {
  const modules = [
    project.proposal,
    project.moodboard,
    project.selection,
    project.gallery,
  ];

  const moduleExists = (i: number) => modules[i - 1] != null;
  const moduleCompleted = (i: number) => modules[i - 1]?.status === "completed";

  // État initial : aucun module n'existe → tous accessibles
  if (!modules.some((m) => m != null)) {
    return true;
  }

  // Si step 4 terminé : seuls les terminés sont accessibles
  if (moduleCompleted(4)) {
    return moduleCompleted(stepNumber);
  }

  // Si le step existe, il est accessible
  if (moduleExists(stepNumber)) {
    return true;
  }

  // Vérifier qu'aucun step antérieur n'est en cours (non terminé)
  for (let i = 1; i < stepNumber; i++) {
    if (moduleExists(i) && !moduleCompleted(i)) {
      return false; // Step antérieur en cours → verrouillé
    }
  }

  // Vérifier qu'aucun step ultérieur n'est en cours (non terminé)
  for (let i = stepNumber + 1; i <= 4; i++) {
    if (moduleExists(i) && !moduleCompleted(i)) {
      return false; // Step ultérieur en cours → verrouillé
    }
  }

  // Step accessible si tous les antérieurs terminés et aucun ultérieur en cours
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
  const accessible = isStepAccessible(stepNumber, project);

  return {
    status: accessible ? "accessible" : "locked",
    canView: accessible,
    canEdit: normalized.exists && accessible,
    moduleExists: normalized.exists,
    moduleStatus: normalized.status,
  };
};

// Get all steps status for a project
export const getProjectStepsStatus = (project: {
  moodboard?: { status: string } | null;
  selection?: { status: string } | null;
  gallery?: { status: string } | null;
}): Record<1 | 2 | 3, StepInfo> => {
  return {
    1: getStepStatus(1, project),
    2: getStepStatus(2, project),
    3: getStepStatus(3, project),
  };
};
