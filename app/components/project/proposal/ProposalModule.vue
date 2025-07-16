<template>
    <UCard variant="outline">
        <template #header>
            <div class="flex items-center gap-3">
                <UIcon name="i-lucide-file-check" class="w-5 h-5 text-emerald-500" />
                <div>
                    <h3 class="font-semibold">Proposition</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Devis et contrat pour le client</p>
                </div>
                <!-- Status badge for existing proposals -->
                <div v-if="proposal" class="ml-auto">
                    <UBadge :color="proposalStatusInfo?.color as any" variant="subtle"
                        :label="proposalStatusInfo?.label" :icon="proposalStatusInfo?.icon" />
                </div>
            </div>
        </template>

        <!-- Loading State -->
        <div v-if="loading" class="py-8 text-center">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
            <p class="text-sm text-neutral-600 dark:text-neutral-400">Chargement de la proposition...</p>
        </div>

        <!-- Error State -->
        <UAlert v-else-if="error" color="error" variant="soft" icon="i-lucide-alert-circle" :title="error.message" />

        <!-- Existing Proposal Display -->
        <div v-else-if="proposal && !showEditForm" class="space-y-4">
            <div
                class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">

                <!-- Proposal Content Viewer (readonly) -->
                <div class="space-y-4">
                    <!-- Content Header -->
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-file-text" class="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Contenu de la
                            proposition</h4>
                    </div>

                    <!-- Content Display -->
                    <ProjectProposalContentBuilder :key="contentKey" :content_json="proposal.content_json"
                        :content_html="proposal.content_html" :status="proposal.status" :readonly="true" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 mt-6">
                    <div class="space-y-1">
                        <span
                            class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Prix</span>
                        <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ formattedPrice }}
                        </p>
                    </div>
                    <div v-if="proposal.deposit_required" class="space-y-1">
                        <span
                            class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Acompte</span>
                        <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{
                            formattedDepositAmount
                        }}
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-2 mb-4">
                    <UButton icon="i-lucide-edit" size="sm" variant="outline" color="neutral"
                        label="Modifier la proposition" :disabled="!canEditProposal" @click="editProposal" />

                    <!-- Client preview button -->
                    <UButton v-if="proposal && proposal.status !== 'draft'" icon="i-lucide-external-link" size="sm"
                        variant="outline" color="neutral" label="Aperçu client" :to="`/proposal/${proposal.id}`"
                        target="_blank" />

                    <!-- Delete button for draft proposals -->
                    <UButton v-if="proposal.status === 'draft'" icon="i-lucide-trash-2" size="sm" variant="outline"
                        color="error" label="Supprimer" @click="confirmDeleteProposal" />
                </div>

                <!-- File attachments -->
                <div v-if="proposal.contract_url || proposal.quote_url" class="space-y-3 mt-4">
                    <h5 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Documents attachés</h5>

                    <ProjectProposalFileViewer v-if="proposal.contract_url" :file-path="proposal.contract_url"
                        @error="handleFileError" />

                    <ProjectProposalFileViewer v-if="proposal.quote_url" :file-path="proposal.quote_url"
                        @error="handleFileError" />
                </div>

                <!-- Revision comment display for revision_requested status -->
                <UAlert v-if="proposal.status === 'revision_requested'" color="warning" variant="soft"
                    icon="i-lucide-message-circle" title="Révisions demandées par le client" class="mt-4">
                    <template #description>
                        <div class="space-y-2">
                            <p>Le client a demandé des modifications à cette proposition.</p>
                            <div v-if="revisionComment"
                                class="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                                <p class="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">Commentaire du
                                    client :</p>
                                <p class="text-sm text-orange-800 dark:text-orange-200 whitespace-pre-wrap">{{
                                    revisionComment }}</p>
                            </div>
                        </div>
                    </template>
                </UAlert>

                <!-- Info for draft proposals -->
                <UAlert v-else-if="proposal.status === 'draft'" color="info" variant="soft" icon="i-lucide-info"
                    title="Proposition en brouillon" class="mt-4">
                    <template #description>
                        Cette proposition est encore en brouillon. Vous pouvez la modifier ou la supprimer.
                    </template>
                </UAlert>

                <!-- Warning for validated proposals -->
                <UAlert v-else-if="proposal.status === 'awaiting_client'" color="info" variant="soft"
                    icon="i-lucide-clock" title="Proposition envoyée" class="mt-4">
                    <template #description>
                        Cette proposition a été envoyée au client et attend sa réponse.
                    </template>
                </UAlert>

                <!-- Success for completed proposals -->
                <UAlert v-else-if="proposal.status === 'completed'" color="success" variant="soft"
                    icon="i-lucide-check-circle" title="Proposition acceptée" class="mt-4">
                    <template #description>
                        Cette proposition a été acceptée par le client.
                    </template>
                </UAlert>
            </div>
        </div>

        <!-- Create/Edit Proposal Form -->
        <div v-else-if="showEditForm">
            <ProjectProposalForm :proposal="proposal || undefined" :project-id="projectId"
                :project-initial-price="projectInitialPrice" @proposal-saved="handleProposalSaved"
                @cancel="handleCancel" />
        </div>

        <!-- Empty state with create button -->
        <div v-else class="py-8 text-center">
            <div
                class="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UIcon name="i-lucide-file-plus" class="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Aucune proposition</h4>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Créez une proposition commerciale pour ce projet
            </p>
            <UButton icon="i-lucide-plus" color="primary" label="Créer une proposition" @click="createProposal" />
        </div>
    </UCard>
</template>

<script lang="ts" setup>
import { useProposal } from '~/composables/proposals/useProposal';
import type { ProposalFormData } from '~/types/proposal';

interface Props {
    projectId: string
    projectInitialPrice?: number
}

const props = defineProps<Props>()

// Use the proposal composable for complete state management
const {
    loading,
    error,
    proposal,
    formattedPrice,
    formattedDepositAmount,
    fetchProposal,
    saveProposal,
    deleteProposal,
} = useProposal(props.projectId)

// Local state
const showEditForm = ref(false)

// Computed properties
const canEditProposal = computed(() => {
    return !proposal.value || proposal.value.status === 'draft' || proposal.value.status === 'revision_requested'
})

// Simple reactive key for component updates
const contentKey = computed(() => {
    if (!proposal.value) return 'no-proposal'
    return `proposal-${proposal.value.id}-${proposal.value.updated_at}`
})

// Status info for badge
const proposalStatusInfo = computed(() => {
    if (!proposal.value) return null

    const statusOptions: Record<string, { color: string; label: string; icon: string }> = {
        draft: { color: 'neutral', label: 'Brouillon', icon: 'i-lucide-file-text' },
        awaiting_client: { color: 'warning', label: 'En attente client', icon: 'i-lucide-clock' },
        revision_requested: { color: 'info', label: 'Révision demandée', icon: 'i-lucide-edit' },
        completed: { color: 'success', label: 'Acceptée', icon: 'i-lucide-check-circle' },
    }

    return statusOptions[proposal.value.status] || null
})

// Revision comment for display
const revisionComment = computed(() => {
    return proposal.value?.revision_last_comment || null
})

// Watch for proposal data changes to reset edit form state
watch(() => proposal.value, (newData) => {
    if (!newData) {
        showEditForm.value = false
    }
}, { immediate: true })

// Methods
const createProposal = () => {
    showEditForm.value = true
}

const editProposal = () => {
    showEditForm.value = true
}

const handleCancel = () => {
    showEditForm.value = false
}

const handleProposalSaved = async (data: { proposal: ProposalFormData; projectUpdated: boolean }) => {
    try {
        const shouldValidate = data.projectUpdated
        await saveProposal(data.proposal, shouldValidate)
        showEditForm.value = false

        // Refresh proposal data
        await fetchProposal()
    } catch (err) {
        console.error('Error saving proposal:', err)
    }
}

const confirmDeleteProposal = async () => {
    if (!proposal.value) return

    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette proposition ? Cette action est irréversible.')
    if (!confirmed) return

    try {
        await deleteProposal()
        // The composable will automatically update the proposal state
    } catch (err) {
        console.error('Error deleting proposal:', err)
    }
}

const handleFileError = (error: string) => {
    console.error('Error opening file:', error)
}

// Load proposal on mount
onMounted(async () => {
    try {
        await fetchProposal()
    } catch (err) {
        console.error('Error loading proposal:', err)
    }
})
</script>