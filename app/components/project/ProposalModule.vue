<template>
    <UCard variant="outline">
        <template #header>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-file-check" class="w-5 h-5 text-emerald-500" />
                    <div>
                        <h3 class="font-semibold">Proposition</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Devis et contrat pour le client</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <!-- Status indicator for existing proposals -->
                    <UBadge v-if="proposalData" :color="proposalStatusInfo?.color as any" variant="subtle"
                        :label="proposalStatusInfo?.label" :icon="proposalStatusInfo?.icon" />
                    <!-- Toggle switch with tooltip wrapper -->
                    <div class="relative">
                        <USwitch :model-value="enabled" color="primary" size="md"
                            :disabled="cannotDisableProposal ?? undefined" @update:model-value="handleToggle" />
                        <UTooltip v-if="cannotDisableProposal" text="Impossible de désactiver : une proposition existe"
                            :content="{ side: 'left' }">
                            <!-- Invisible overlay to capture hover -->
                            <div class="absolute inset-0 cursor-not-allowed" />
                        </UTooltip>
                    </div>
                </div>
            </div>
        </template>

        <div v-if="enabled" class="space-y-4">
            <!-- Existing Proposal Display -->
            <div v-if="proposalData && !showEditForm" class="space-y-4">
                <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="flex items-start justify-between mb-3">
                        <div class="space-y-1">
                            <h4 class="font-semibold text-gray-900 dark:text-gray-100">{{ proposalData.title }}</h4>
                            <p v-if="proposalData.description" class="text-sm text-gray-600 dark:text-gray-400">
                                {{ proposalData.description }}
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prix</span>
                            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ formattedPrice }}</p>
                        </div>
                        <div v-if="proposalData.deposit_required" class="space-y-1">
                            <span
                                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Acompte</span>
                            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ formattedDepositAmount
                            }}
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 mb-4">
                        <UButton icon="i-lucide-edit" size="sm" variant="outline" color="primary" label="Modifier"
                            :disabled="!canEditProposal" @click="editProposal" />

                        <!-- Delete button for draft proposals -->
                        <UButton v-if="proposalData.status === 'draft'" icon="i-lucide-trash-2" size="sm"
                            variant="outline" color="error" label="Supprimer" :loading="isDeleting"
                            @click="confirmDeleteProposal" />
                    </div>

                    <!-- File attachments -->
                    <div v-if="proposalData.contract_url || proposalData.quote_url" class="space-y-3 mt-4">
                        <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100">Documents attachés</h5>

                        <ProposalFileViewer v-if="proposalData.contract_url" :file-path="proposalData.contract_url"
                            @error="handleFileError" />

                        <ProposalFileViewer v-if="proposalData.quote_url" :file-path="proposalData.quote_url"
                            @error="handleFileError" />
                    </div>

                    <!-- Warning for validated proposals -->
                    <UAlert v-if="!canEditProposal" color="warning" variant="soft" icon="i-lucide-info"
                        title="Proposition validée" class="mt-4">
                        <template #description>
                            Cette proposition a été envoyée au client et ne peut plus être modifiée ni supprimée.
                            Le module ne peut pas être désactivé.
                        </template>
                    </UAlert>

                    <!-- Info for draft proposals -->
                    <UAlert v-else-if="proposalData.status === 'draft'" color="info" variant="soft" icon="i-lucide-info"
                        title="Proposition en brouillon" class="mt-4">
                        <template #description>
                            Cette proposition est encore en brouillon. Vous pouvez la modifier ou la supprimer.
                            Le module ne peut pas être désactivé tant qu'une proposition existe.
                        </template>
                    </UAlert>
                </div>
            </div>

            <!-- Create/Edit Proposal Form -->
            <div v-else-if="!proposalData || showEditForm">
                <!-- Progress indicator for new proposals -->
                <div v-if="!proposalData" class="mb-6">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-lucide-plus" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 dark:text-gray-100">Créer une proposition</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Remplissez les informations ci-dessous
                                pour créer votre proposition</p>
                        </div>
                    </div>

                    <!-- Quick tips -->
                    <UAlert color="info" variant="soft" icon="i-lucide-lightbulb" title="Conseils">
                        <template #description>
                            <ul class="text-sm space-y-1 mt-2">
                                <li>• <strong>Brouillon</strong> : Sauvegarde sans envoyer au client</li>
                                <li>• <strong>Valider</strong> : Envoie la proposition et passe le projet "En cours"
                                </li>
                                <li>• Les fichiers sont optionnels mais recommandés pour la transparence</li>
                            </ul>
                        </template>
                    </UAlert>
                </div>

                <ProjectProposalForm :proposal="showEditForm ? (proposalData || undefined) : undefined"
                    :project-id="projectId" :project-initial-price="projectInitialPrice"
                    @proposal-saved="handleProposalSaved" @cancel="handleCancel" />
            </div>
        </div>

        <!-- Module disabled state -->
        <div v-else class="py-8 text-center">
            <div
                class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UIcon name="i-lucide-file-check" class="w-8 h-8 text-gray-400" />
            </div>
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">Module Proposition désactivé</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Activez ce module pour créer des propositions commerciales pour vos clients
            </p>
            <div class="text-xs text-gray-500 dark:text-gray-400">
                <UIcon name="i-lucide-arrow-up" class="w-3 h-3 inline mr-1" />
                Utilisez le switch ci-dessus pour activer
            </div>
        </div>
    </UCard>
</template>

<script lang="ts" setup>
import ProposalFileViewer from '~/components/project/ProposalFileViewer.vue';
import type { Proposal } from '~/types/proposal';

interface Props {
    enabled: boolean
    proposalData: Proposal | null
    proposalStatusInfo: { color: string; label: string; icon: string } | null
    formattedPrice: string
    formattedDepositAmount: string
    projectId: string
    projectInitialPrice?: number
}

interface Emits {
    (e: 'update:enabled', value: boolean): void
    (e: 'proposal-saved', data: { proposal: Proposal; projectUpdated: boolean }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const showEditForm = ref(false)
const isDeleting = ref(false)

// Computed properties
const cannotDisableProposal = computed(() => {
    // Cannot disable if any proposal exists (even draft)
    return !!props.proposalData
})

const canEditProposal = computed(() => {
    return !props.proposalData || props.proposalData.status === 'draft'
})

// Methods
const handleToggle = (value: boolean) => {
    // Prevent disabling if any proposal exists
    if (!value && cannotDisableProposal.value) {
        // Reset the toggle to enabled state
        emit('update:enabled', true)

        const toast = useToast()
        toast.add({
            title: 'Action impossible',
            description: 'Impossible de désactiver le module : une proposition existe. Supprimez-la d\'abord si elle est en brouillon.',
            icon: 'i-lucide-alert-circle',
            color: 'warning'
        })
        return
    }

    emit('update:enabled', value)
}

const editProposal = () => {
    showEditForm.value = true
}

const handleCancel = () => {
    showEditForm.value = false
}

const handleProposalSaved = (data: { proposal: Proposal; projectUpdated: boolean }) => {
    showEditForm.value = false
    emit('proposal-saved', data)
}

const confirmDeleteProposal = async () => {
    if (!props.proposalData) return

    const toast = useToast()

    // Show confirmation dialog
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette proposition ? Cette action est irréversible.')

    if (!confirmed) return

    isDeleting.value = true

    try {
        // Import the proposal service
        const { proposalService } = await import('~/services/proposalService')

        // Delete the proposal
        await proposalService.deleteProposal(props.proposalData.id)

        // Show success message
        toast.add({
            title: 'Proposition supprimée',
            description: 'La proposition a été supprimée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        // Emit event to refresh parent data (proposal deleted)
        // We need to trigger a refresh, but there's no proposal to return
        // The parent will handle fetching updated data
        window.location.reload() // Simple solution to refresh the page

    } catch (err) {
        console.error('Error deleting proposal:', err)
        toast.add({
            title: 'Erreur',
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors de la suppression.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    } finally {
        isDeleting.value = false
    }
}

const handleFileError = (error: string) => {
    // Handle file error
    console.error('Error opening file:', error)
}
</script>