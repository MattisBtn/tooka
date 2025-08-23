<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'
import { feedbackService } from '~/services/feedbackService'
import type { FeedbackType, FeedbackWithUser } from '~/types/feedback'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const { getAllFeedback, deleteFeedback } = feedbackService

const feedbacks = ref<FeedbackWithUser[]>([])
const isLoading = ref(true)
const selectedType = ref<FeedbackType | 'all'>('all')
const expandedRows = ref<Record<string, boolean>>({})

// Modal state
const showConfirmModal = ref(false)
const feedbackToDelete = ref<FeedbackWithUser | null>(null)

const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Nouvelle fonctionnalité' },
    { value: 'question', label: 'Question' },
    { value: 'other', label: 'Autre' }
]

const getTypeColor = (type: FeedbackType) => {
    switch (type) {
        case 'bug': return 'error'
        case 'feature': return 'info'
        case 'question': return 'warning'
        case 'other': return 'neutral'
        default: return 'neutral'
    }
}

const filteredFeedbacks = computed(() => {
    return feedbacks.value.filter(feedback => {
        return selectedType.value === 'all' || feedback.type === selectedType.value
    })
})

const loadFeedbacks = async () => {
    isLoading.value = true
    try {
        const data = await getAllFeedback()
        feedbacks.value = data
    } catch (error) {
        console.error('Error loading feedbacks:', error)
    } finally {
        isLoading.value = false
    }
}

const handleDelete = async (id: string) => {
    try {
        await deleteFeedback(id)
        await loadFeedbacks()
    } catch (error) {
        console.error('Error deleting feedback:', error)
    }
}

const openConfirmModal = (feedback: FeedbackWithUser) => {
    feedbackToDelete.value = feedback
    showConfirmModal.value = true
}

const confirmDelete = async () => {
    if (feedbackToDelete.value) {
        await handleDelete(feedbackToDelete.value.id)
        showConfirmModal.value = false
        feedbackToDelete.value = null
    }
}

const closeConfirmModal = () => {
    showConfirmModal.value = false
    feedbackToDelete.value = null
}

// Load feedbacks on mount
onMounted(() => {
    loadFeedbacks()
})

const columns: TableColumn<FeedbackWithUser>[] = [
    {
        id: 'expand',
        cell: ({ row }) =>
            h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                icon: 'i-lucide-chevron-down',
                square: true,
                'aria-label': 'Expand',
                ui: {
                    leadingIcon: [
                        'transition-transform',
                        row.getIsExpanded() ? 'duration-200 rotate-180' : ''
                    ]
                },
                onClick: () => row.toggleExpanded()
            })
    },
    {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
            const type = row.original.type
            return h(UBadge, {
                color: getTypeColor(type),
                variant: 'subtle',
                class: 'capitalize'
            }, () => typeOptions.find(opt => opt.value === type)?.label || type)
        }
    },
    {
        accessorKey: 'title',
        header: 'Titre',
        cell: ({ row }) => {
            return h('div', { class: 'font-medium max-w-xs truncate' }, row.original.title)
        }
    },
    {
        accessorKey: 'user_profile',
        header: 'Utilisateur',
        cell: ({ row }) => {
            const user = row.original.user_profile
            if (!user) return 'Utilisateur supprimé'

            const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
            return name || 'Utilisateur anonyme'
        }
    },
    {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => {
            const date = row.original.created_at
            return date
                ? new Intl.DateTimeFormat('fr-FR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(new Date(date))
                : ''
        }
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            return h(UButton, {
                icon: 'i-lucide-check',
                size: 'sm',
                color: 'success',
                variant: 'ghost',
                'aria-label': 'Traité',
                onClick: () => openConfirmModal(row.original)
            })
        }
    }
]

// Filter options for dropdown menu (same pattern as other admin pages)
const typeFilterOptions = [
    [
        {
            label: "Tous les types",
            icon: "i-lucide-filter",
            onSelect: () => selectedType.value = 'all'
        },
        {
            label: "Bug",
            icon: "i-heroicons-exclamation-triangle",
            onSelect: () => selectedType.value = 'bug'
        },
        {
            label: "Nouvelle fonctionnalité",
            icon: "i-heroicons-light-bulb",
            onSelect: () => selectedType.value = 'feature'
        },
        {
            label: "Question",
            icon: "i-heroicons-question-mark-circle",
            onSelect: () => selectedType.value = 'question'
        },
        {
            label: "Autre",
            icon: "i-heroicons-chat-bubble-left-right",
            onSelect: () => selectedType.value = 'other'
        }
    ]
]

const currentTypeFilterLabel = computed(() => {
    if (selectedType.value === 'all') return "Tous les types"
    return typeOptions.find(opt => opt.value === selectedType.value)?.label || "Tous les types"
})
</script>

<template>
    <div class="space-y-6">
        <!-- Filters and Search Bar -->
        <div class="p-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
                <UDropdownMenu :items="typeFilterOptions" :popper="{ placement: 'bottom-end' }">
                    <UButton icon="i-lucide-filter" color="neutral" variant="outline" :label="currentTypeFilterLabel" />
                </UDropdownMenu>
            </div>
        </div>

        <!-- Feedback Table -->
        <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <UTable v-model:expanded="expandedRows" :columns="columns" :data="filteredFeedbacks" :loading="isLoading"
                empty="Aucun feedback trouvé" :ui="{
                    thead: 'bg-gray-50 dark:bg-gray-800/50',
                    th: 'text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100',
                    td: 'py-3 px-4 border-t border-gray-200 dark:border-gray-700',
                    tbody: 'divide-y divide-gray-200 dark:divide-gray-700',
                    tr: 'data-[expanded=true]:bg-elevated/50'
                }">
                <template #expanded="{ row }">
                    <div class="bg-gray-50 dark:bg-gray-800 w-full p-4 rounded-lg">
                        <div class="flex items-start gap-3">
                            <div
                                class="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                                <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div class="flex-1">
                                <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">Description
                                    complète</h4>
                                <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                    {{ row.original.description }}
                                </p>
                            </div>
                        </div>
                    </div>
                </template>
            </UTable>
        </div>

        <!-- Stats Summary -->
        <div v-if="!isLoading && feedbacks.length > 0"
            class="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400">
            <div class="flex items-center gap-2">
                <UIcon name="i-lucide-message-circle" class="w-4 h-4" />
                <span>{{ feedbacks.length }} feedback{{ feedbacks.length > 1 ? 's' : '' }}</span>
            </div>
            <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-500" />
                <span>{{feedbacks.filter(f => f.type === 'bug').length}} bug{{feedbacks.filter(f => f.type ===
                    'bug').length
                    > 1 ? 's' : ''}}</span>
            </div>
            <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-blue-500" />
                <span>{{feedbacks.filter(f => f.type === 'feature').length}} fonctionnalité{{feedbacks.filter(f =>
                    f.type ===
                    'feature').length > 1 ? 's' : ''}}</span>
            </div>
            <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-question-mark-circle" class="w-4 h-4 text-yellow-500" />
                <span>{{feedbacks.filter(f => f.type === 'question').length}} question{{feedbacks.filter(f => f.type
                    ===
                    'question').length > 1 ? 's' : ''}}</span>
            </div>
        </div>

        <!-- Confirm Delete Modal -->
        <UModal :open="showConfirmModal" title="Marquer comme traité"
            description="Êtes-vous sûr de vouloir marquer ce feedback comme traité ? Cette action est irréversible.">
            <template #footer>
                <div class="flex items-center justify-end gap-3 w-full">
                    <UButton color="neutral" variant="ghost" label="Annuler" @click="closeConfirmModal" />
                    <UButton color="success" label="Marquer comme traité" @click="confirmDelete" />
                </div>
            </template>
        </UModal>
    </div>
</template>
