/**
 * Status types and utilities for projects and modules
 */

// Project Status Types
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress', 
  COMPLETED: 'completed'
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

// Module Status Types (for proposals, moodboards, selections, galleries)
export const MODULE_STATUS = {
  DRAFT: 'draft',
  AWAITING_CLIENT: 'awaiting_client',
  REVISION_REQUESTED: 'revision_requested',
  COMPLETED: 'completed',
  PAYMENT_PENDING: 'payment_pending'
} as const;

export type ModuleStatus = typeof MODULE_STATUS[keyof typeof MODULE_STATUS];

// All possible status values
export type Status = ProjectStatus | ModuleStatus;

// Status UI Configuration
export interface StatusItem {
  value: Status;
  label: string;
  description: string;
  icon: string;
  color: string;
}

// Project Status Items for UI
export const PROJECT_STATUS_ITEMS: Record<ProjectStatus, StatusItem> = {
  [PROJECT_STATUS.DRAFT]: {
    value: PROJECT_STATUS.DRAFT,
    label: 'Brouillon',
    description: 'Projet en cours de création',
    icon: 'i-lucide-edit',
    color: 'gray'
  },
  [PROJECT_STATUS.IN_PROGRESS]: {
    value: PROJECT_STATUS.IN_PROGRESS,
    label: 'En cours',
    description: 'Projet en cours de réalisation',
    icon: 'i-lucide-clock',
    color: 'orange'
  },
  [PROJECT_STATUS.COMPLETED]: {
    value: PROJECT_STATUS.COMPLETED,
    label: 'Terminé',
    description: 'Projet finalisé',
    icon: 'i-lucide-check-circle',
    color: 'green'
  }
};

// Module Status Items for UI
export const MODULE_STATUS_ITEMS: Record<ModuleStatus, StatusItem> = {
  [MODULE_STATUS.DRAFT]: {
    value: MODULE_STATUS.DRAFT,
    label: 'Brouillon',
    description: 'En cours de préparation',
    icon: 'i-lucide-edit',
    color: 'gray'
  },
  [MODULE_STATUS.AWAITING_CLIENT]: {
    value: MODULE_STATUS.AWAITING_CLIENT,
    label: 'En attente du client',
    description: 'Envoyé au client pour validation',
    icon: 'i-lucide-clock',
    color: 'blue'
  },
  [MODULE_STATUS.REVISION_REQUESTED]: {
    value: MODULE_STATUS.REVISION_REQUESTED,
    label: 'Révision demandée',
    description: 'Le client a demandé des modifications',
    icon: 'i-lucide-message-circle',
    color: 'orange'
  },
  [MODULE_STATUS.COMPLETED]: {
    value: MODULE_STATUS.COMPLETED,
    label: 'Validé',
    description: 'Validé par le client',
    icon: 'i-lucide-check-circle',
    color: 'green'
  },
  [MODULE_STATUS.PAYMENT_PENDING]: {
    value: MODULE_STATUS.PAYMENT_PENDING,
    label: 'Paiement en attente',
    description: 'En attente du paiement client',
    icon: 'i-lucide-credit-card',
    color: 'yellow'
  }
};

// Utility Functions
export const StatusUtils = {
  /**
   * Get status item configuration for any status
   */
  getStatusItem(status: Status): StatusItem | null {
    if (status in PROJECT_STATUS_ITEMS) {
      return PROJECT_STATUS_ITEMS[status as ProjectStatus];
    }
    if (status in MODULE_STATUS_ITEMS) {
      return MODULE_STATUS_ITEMS[status as ModuleStatus];
    }
    return null;
  },

  /**
   * Check if status is a project status
   */
  isProjectStatus(status: string): status is ProjectStatus {
    return Object.values(PROJECT_STATUS).includes(status as ProjectStatus);
  },

  /**
   * Check if status is a module status
   */
  isModuleStatus(status: string): status is ModuleStatus {
    return Object.values(MODULE_STATUS).includes(status as ModuleStatus);
  },

  /**
   * Get all project status options for UI selects
   */
  getProjectStatusOptions(): StatusItem[] {
    return Object.values(PROJECT_STATUS_ITEMS);
  },

  /**
   * Get all module status options for UI selects
   */
  getModuleStatusOptions(): StatusItem[] {
    return Object.values(MODULE_STATUS_ITEMS);
  },

  /**
   * Check if status indicates completion
   */
  isCompleted(status: Status): boolean {
    return status === PROJECT_STATUS.COMPLETED || status === MODULE_STATUS.COMPLETED;
  },

  /**
   * Check if status indicates draft state
   */
  isDraft(status: Status): boolean {
    return status === PROJECT_STATUS.DRAFT || status === MODULE_STATUS.DRAFT;
  },

  /**
   * Check if status indicates waiting for client action
   */
  isAwaitingClient(status: Status): boolean {
    return status === MODULE_STATUS.AWAITING_CLIENT || status === MODULE_STATUS.PAYMENT_PENDING;
  },

  /**
   * Check if status indicates revision is needed
   */
  needsRevision(status: Status): boolean {
    return status === MODULE_STATUS.REVISION_REQUESTED;
  },

  /**
   * Check if status indicates payment is pending
   */
  isPaymentPending(status: Status): boolean {
    return status === MODULE_STATUS.PAYMENT_PENDING;
  },

  /**
   * Get next logical status for workflow progression
   */
  getNextStatus(currentStatus: ModuleStatus, action: 'submit' | 'validate' | 'request_revision' | 'payment'): ModuleStatus {
    switch (action) {
      case 'submit':
        return currentStatus === MODULE_STATUS.DRAFT ? MODULE_STATUS.AWAITING_CLIENT : currentStatus;
      case 'validate':
        return MODULE_STATUS.COMPLETED;
      case 'request_revision':
        return MODULE_STATUS.REVISION_REQUESTED;
      case 'payment':
        return MODULE_STATUS.PAYMENT_PENDING;
      default:
        return currentStatus;
    }
  },

  /**
   * Check if status transition is valid
   */
  canTransitionTo(from: Status, to: Status): boolean {
    // Define valid transitions
    const validTransitions: Record<Status, Status[]> = {
      // Project statuses
      [PROJECT_STATUS.DRAFT]: [PROJECT_STATUS.IN_PROGRESS],
      [PROJECT_STATUS.IN_PROGRESS]: [PROJECT_STATUS.COMPLETED],
      [PROJECT_STATUS.COMPLETED]: [],

      // Module statuses
      [MODULE_STATUS.DRAFT]: [MODULE_STATUS.AWAITING_CLIENT],
      [MODULE_STATUS.AWAITING_CLIENT]: [MODULE_STATUS.COMPLETED, MODULE_STATUS.REVISION_REQUESTED, MODULE_STATUS.PAYMENT_PENDING],
      [MODULE_STATUS.REVISION_REQUESTED]: [MODULE_STATUS.AWAITING_CLIENT],
      [MODULE_STATUS.PAYMENT_PENDING]: [MODULE_STATUS.COMPLETED],
      [MODULE_STATUS.COMPLETED]: []
    };

    return validTransitions[from]?.includes(to) ?? false;
  }
};

// Type guards
export const isProjectStatus = StatusUtils.isProjectStatus;
export const isModuleStatus = StatusUtils.isModuleStatus;