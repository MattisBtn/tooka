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
                <div v-if="proposalData" class="ml-auto">
                    <UBadge :color="proposalStatusInfo?.color as any" variant="subtle"
                        :label="proposalStatusInfo?.label" :icon="proposalStatusInfo?.icon" />
                </div>
            </div>
        </template>

        <!-- Existing Proposal Display -->
        <div v-if="proposalData && !showEditForm" class="space-y-4">
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
                    <ProjectProposalContentBuilder :key="contentKey" :content_json="contentJsonComponents"
                        :content_html="proposalData.content_html" :status="proposalData.status" :readonly="true" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 mt-6">
                    <div class="space-y-1">
                        <span
                            class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Prix</span>
                        <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ formattedPrice }}
                        </p>
                    </div>
                    <div v-if="proposalData.deposit_required" class="space-y-1">
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

                    <!-- Delete button for draft proposals -->
                    <UButton v-if="proposalData.status === 'draft'" icon="i-lucide-trash-2" size="sm" variant="outline"
                        color="error" label="Supprimer" @click="confirmDeleteProposal" />
                </div>

                <!-- File attachments -->
                <div v-if="proposalData.contract_url || proposalData.quote_url" class="space-y-3 mt-4">
                    <h5 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Documents attachés</h5>

                    <ProjectProposalFileViewer v-if="proposalData.contract_url" :file-path="proposalData.contract_url"
                        @error="handleFileError" />

                    <ProjectProposalFileViewer v-if="proposalData.quote_url" :file-path="proposalData.quote_url"
                        @error="handleFileError" />
                </div>

                <!-- Warning for validated proposals -->
                <UAlert v-if="!canEditProposal" color="warning" variant="soft" icon="i-lucide-info"
                    title="Proposition validée" class="mt-4">
                    <template #description>
                        Cette proposition a été envoyée au client et ne peut plus être modifiée ni supprimée.
                    </template>
                </UAlert>

                <!-- Info for draft proposals -->
                <UAlert v-else-if="proposalData.status === 'draft'" color="info" variant="soft" icon="i-lucide-info"
                    title="Proposition en brouillon" class="mt-4">
                    <template #description>
                        Cette proposition est encore en brouillon. Vous pouvez la modifier ou la supprimer.
                    </template>
                </UAlert>
            </div>
        </div>

        <!-- Create/Edit Proposal Form -->
        <div v-else-if="showEditForm">
            <ProjectProposalForm :proposal="proposalData || undefined" :project-id="projectId"
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
import type { ProposalComponent } from '~/composables/proposals/useProposalContentBuilder';
import type { Proposal, ProposalFormData } from '~/types/proposal';

interface Props {
    proposalData: Proposal | null
    proposalStatusInfo: { color: string; label: string; icon: string } | null
    formattedPrice: string
    formattedDepositAmount: string
    projectId: string
    projectInitialPrice?: number
}

interface Emits {
    (e: 'proposal-saved', data: { proposal: Proposal | ProposalFormData; projectUpdated: boolean }): void
    (e: 'delete-proposal', proposalId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const showEditForm = ref(false)

// Computed properties
const canEditProposal = computed(() => {
    return !props.proposalData || props.proposalData.status === 'draft'
})

// Convert Json content_json to ProposalComponent[] for the content builder
const contentJsonComponents = computed(() => {
    if (!props.proposalData?.content_json || !Array.isArray(props.proposalData.content_json)) {
        return null
    }

    // Return the array directly - let the content builder handle deep copying if needed
    return props.proposalData.content_json as unknown as ProposalComponent[]
})

// Watch for proposal data changes to reset edit form state
watch(() => props.proposalData, (newData) => {
    // If proposal becomes null (deleted), ensure we're not in edit mode
    if (!newData) {
        showEditForm.value = false
    }
}, { immediate: true })

// Simple reactive key for component updates
const contentKey = computed(() => {
    if (!props.proposalData) return 'no-proposal'
    return `proposal-${props.proposalData.id}-${props.proposalData.updated_at}`
})

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

const handleProposalSaved = (data: { proposal: ProposalFormData; projectUpdated: boolean }) => {
    showEditForm.value = false
    // Convert ProposalFormData to Proposal format for parent component
    emit('proposal-saved', {
        proposal: data.proposal as unknown as Proposal,
        projectUpdated: data.projectUpdated
    })
}

const confirmDeleteProposal = () => {
    if (!props.proposalData) return

    // Show confirmation dialog
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette proposition ? Cette action est irréversible.')

    if (!confirmed) return

    // Emit event to let parent handle deletion via composable
    emit('delete-proposal', props.proposalData.id)
}

const handleFileError = (error: string) => {
    // Handle file error
    console.error('Error opening file:', error)
}
</script>