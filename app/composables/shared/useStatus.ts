import type { ComputedRef } from 'vue'
import { StatusUtils, PROJECT_STATUS_ITEMS, MODULE_STATUS_ITEMS } from '~/types/status'
import type { Status, StatusItem, ProjectStatus, ModuleStatus } from '~/types/status'

/**
 * Composable for status management
 * Provides reactive utilities for working with project and module statuses
 */
export function useStatus() {
  /**
   * Get status item configuration
   */
  const getStatusItem = (status: Status): StatusItem | null => {
    return StatusUtils.getStatusItem(status)
  }

  /**
   * Get reactive status item
   */
  const useStatusItem = (status: ComputedRef<Status> | Ref<Status>): ComputedRef<StatusItem | null> => {
    return computed(() => StatusUtils.getStatusItem(unref(status)))
  }

  /**
   * Get all project status options for select components
   */
  const projectStatusOptions = computed(() => StatusUtils.getProjectStatusOptions())

  /**
   * Get all module status options for select components
   */
  const moduleStatusOptions = computed(() => StatusUtils.getModuleStatusOptions())

  /**
   * Check if status indicates completion
   */
  const isCompleted = (status: Status): boolean => {
    return StatusUtils.isCompleted(status)
  }

  /**
   * Check if status indicates draft state
   */
  const isDraft = (status: Status): boolean => {
    return StatusUtils.isDraft(status)
  }

  /**
   * Check if status indicates waiting for client action
   */
  const isAwaitingClient = (status: Status): boolean => {
    return StatusUtils.isAwaitingClient(status)
  }

  /**
   * Check if status indicates revision is needed
   */
  const needsRevision = (status: Status): boolean => {
    return StatusUtils.needsRevision(status)
  }

  /**
   * Check if status indicates payment is pending
   */
  const isPaymentPending = (status: Status): boolean => {
    return StatusUtils.isPaymentPending(status)
  }

  /**
   * Get next logical status for workflow progression
   */
  const getNextStatus = (currentStatus: ModuleStatus, action: 'submit' | 'validate' | 'request_revision' | 'payment'): ModuleStatus => {
    return StatusUtils.getNextStatus(currentStatus, action)
  }

  /**
   * Check if status transition is valid
   */
  const canTransitionTo = (from: Status, to: Status): boolean => {
    return StatusUtils.canTransitionTo(from, to)
  }

  /**
   * Format status for display with icon and color
   */
  const formatStatus = (status: Status) => {
    const statusItem = getStatusItem(status)
    if (!statusItem) return { label: status, icon: 'i-lucide-help-circle', color: 'gray' }
    
    return {
      label: statusItem.label,
      description: statusItem.description,
      icon: statusItem.icon,
      color: statusItem.color
    }
  }

  /**
   * Get reactive formatted status
   */
  const useFormattedStatus = (status: ComputedRef<Status> | Ref<Status>) => {
    return computed(() => formatStatus(unref(status)))
  }

  /**
   * Create status badge properties for UI components
   */
  const getStatusBadge = (status: Status) => {
    const statusItem = getStatusItem(status)
    if (!statusItem) return { label: status, color: 'gray', variant: 'subtle' as const }
    
    return {
      label: statusItem.label,
      color: statusItem.color as any,
      variant: 'subtle' as const,
      icon: statusItem.icon
    }
  }

  /**
   * Get reactive status badge properties
   */
  const useStatusBadge = (status: ComputedRef<Status> | Ref<Status>) => {
    return computed(() => getStatusBadge(unref(status)))
  }

  /**
   * Filter status options based on current status and allowed transitions
   */
  const getAvailableTransitions = (currentStatus: Status, isModule = true) => {
    const allOptions = isModule ? moduleStatusOptions.value : projectStatusOptions.value
    return allOptions.filter(option => 
      option.value === currentStatus || canTransitionTo(currentStatus, option.value)
    )
  }

  /**
   * Get status color class for UI styling
   */
  const getStatusColorClass = (status: Status, prefix = 'text') => {
    const statusItem = getStatusItem(status)
    if (!statusItem) return `${prefix}-gray-500`
    
    const colorMap: Record<string, string> = {
      gray: `${prefix}-gray-500`,
      blue: `${prefix}-blue-500`,
      orange: `${prefix}-orange-500`,
      green: `${prefix}-green-500`,
      yellow: `${prefix}-yellow-500`,
      red: `${prefix}-red-500`
    }
    
    return colorMap[statusItem.color] || `${prefix}-gray-500`
  }

  return {
    // Direct utilities
    getStatusItem,
    formatStatus,
    getStatusBadge,
    getAvailableTransitions,
    getStatusColorClass,
    
    // Reactive utilities
    useStatusItem,
    useFormattedStatus,
    useStatusBadge,
    
    // Options for select components
    projectStatusOptions,
    moduleStatusOptions,
    
    // Status checks
    isCompleted,
    isDraft,
    isAwaitingClient,
    needsRevision,
    isPaymentPending,
    
    // Workflow utilities
    getNextStatus,
    canTransitionTo,
    
    // Constants for direct access
    PROJECT_STATUS_ITEMS,
    MODULE_STATUS_ITEMS
  }
}