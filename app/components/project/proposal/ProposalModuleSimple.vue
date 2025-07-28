<template>
    <UCard variant="outline">
        <template #header>
            <div class="flex items-center gap-3">
                <UIcon name="i-lucide-file-check" class="w-5 h-5 text-emerald-500" />
                <div>
                    <h3 class="font-semibold">Proposition</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Devis et contrat pour le client</p>
                </div>
                <!-- Status badge -->
                <div v-if="proposalManager.exists.value" class="ml-auto">
                    <UBadge :color="proposalManager.statusInfo.value?.color as any" variant="subtle"
                        :label="proposalManager.statusInfo.value?.label"
                        :icon="proposalManager.statusInfo.value?.icon" />
                </div>
            </div>
        </template>

        <!-- Loading State -->
        <div v-if="proposalManager.loading.value" class="py-8 text-center">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
            <p class="text-sm text-neutral-600 dark:text-neutral-400">Chargement...</p>
        </div>

        <!-- Error State -->
        <UAlert v-else-if="proposalManager.error.value" color="error" variant="soft" icon="i-lucide-alert-circle"
            :title="proposalManager.error.value" />

        <!-- Content -->
        <div v-else>
            <!-- Existing Proposal -->
            <div v-if="proposalManager.exists.value && !showForm" class="space-y-4">
                <div
                    class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">

                    <!-- Proposal Content Viewer (readonly) -->
                    <div class="space-y-4 mb-6">
                        <!-- Content Header -->
                        <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-file-text" class="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                            <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Contenu de la
                                proposition
                            </h4>
                        </div>

                        <!-- Content Display -->
                        <ProjectProposalContentBuilder :key="contentKey"
                            :content_json="proposalManager.proposal.value?.content_json || []"
                            :content_html="proposalManager.proposal.value?.content_html || ''"
                            :status="proposalManager.proposal.value?.status as any" :readonly="true" />
                    </div>

                    <!-- Pricing Information -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Prix</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {{ proposalManager.formattedPrice.value }}
                            </p>
                        </div>
                        <div v-if="proposalManager.proposal.value?.deposit_required" class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Acompte</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {{ proposalManager.formattedDepositAmount.value }}
                            </p>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-2 mb-4">
                        <UButton icon="i-lucide-edit" size="sm" variant="outline" color="neutral"
                            label="Modifier la proposition" :disabled="!proposalManager.canEdit.value"
                            @click="showForm = true" />

                        <UButton v-if="proposalManager.proposal.value?.status !== 'draft'" icon="i-lucide-external-link"
                            size="sm" variant="outline" color="neutral" label="Aperçu client"
                            :to="`/proposal/${proposalManager.proposal.value?.id}`" target="_blank" />

                        <UButton v-if="proposalManager.proposal.value?.status === 'draft'" icon="i-lucide-trash-2"
                            size="sm" variant="outline" color="error" label="Supprimer"
                            :loading="proposalManager.loading.value" @click="handleDelete" />
                    </div>

                    <!-- File attachments -->
                    <div v-if="proposalManager.proposal.value?.contract_url || proposalManager.proposal.value?.quote_url"
                        class="space-y-3 mt-4">
                        <h5 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Documents attachés</h5>

                        <ProjectProposalFileViewer v-if="proposalManager.proposal.value?.contract_url"
                            :file-path="proposalManager.proposal.value.contract_url" @error="handleFileError" />

                        <ProjectProposalFileViewer v-if="proposalManager.proposal.value?.quote_url"
                            :file-path="proposalManager.proposal.value.quote_url" @error="handleFileError" />
                    </div>

                    <!-- Revision comment display for revision_requested status -->
                    <UAlert v-if="proposalManager.proposal.value?.status === 'revision_requested'" color="warning"
                        variant="soft" icon="i-lucide-message-circle" title="Révisions demandées par le client"
                        class="mt-4">
                        <template #description>
                            <div class="space-y-2">
                                <p>Le client a demandé des modifications à cette proposition.</p>
                                <div v-if="revisionComment"
                                    class="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                                    <p class="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">Commentaire
                                        du client :</p>
                                    <p class="text-sm text-orange-800 dark:text-orange-200 whitespace-pre-wrap">{{
                                        revisionComment }}</p>
                                </div>
                            </div>
                        </template>
                    </UAlert>

                    <!-- Payment pending alert -->
                    <UAlert v-if="proposalManager.proposal.value?.status === 'payment_pending'" color="info"
                        variant="soft" icon="i-lucide-clock" title="Paiement en attente de confirmation" class="mt-4">
                        <template #description>
                            <div class="space-y-3">
                                <p>Le client a initié le paiement d'acompte. Vérifiez votre compte bancaire et confirmez
                                    la réception.</p>
                                <UButton color="success" icon="i-lucide-check-circle" size="sm"
                                    label="Confirmer la réception du paiement" :loading="proposalManager.loading.value"
                                    @click="handleConfirmPayment" />
                            </div>
                        </template>
                    </UAlert>

                    <!-- Info for draft proposals -->
                    <UAlert v-else-if="proposalManager.proposal.value?.status === 'draft'" color="info" variant="soft"
                        icon="i-lucide-info" title="Proposition en brouillon" class="mt-4">
                        <template #description>
                            Cette proposition est encore en brouillon. Vous pouvez la modifier ou la supprimer.
                        </template>
                    </UAlert>

                    <!-- Warning for validated proposals -->
                    <UAlert v-else-if="proposalManager.proposal.value?.status === 'awaiting_client'" color="info"
                        variant="soft" icon="i-lucide-clock" title="Proposition envoyée" class="mt-4">
                        <template #description>
                            Cette proposition a été envoyée au client et attend sa réponse.
                        </template>
                    </UAlert>

                    <!-- Success for completed proposals -->
                    <UAlert v-else-if="proposalManager.proposal.value?.status === 'completed'" color="success"
                        variant="soft" icon="i-lucide-check-circle" title="Proposition acceptée" class="mt-4">
                        <template #description>
                            Cette proposition a été acceptée par le client.
                        </template>
                    </UAlert>
                </div>
            </div>

            <!-- Form -->
            <div v-else-if="showForm">
                <!-- S'assurer que les données du projet sont chargées avant de rendre le formulaire -->
                <div v-if="projectLoading" class="py-8 text-center">
                    <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Chargement des données...</p>
                </div>
                <ProjectProposalForm v-else :proposal="proposalManager.proposal.value || undefined"
                    :project="projectPaymentData" :project-id="projectId" :project-initial-price="projectInitialPrice"
                    @proposal-saved="handleProposalSaved" @cancel="configureModule('proposal')" />
            </div>

            <!-- Empty State -->
            <div v-else class="py-8 text-center">
                <div
                    class="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UIcon name="i-lucide-file-plus" class="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Aucune proposition</h4>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                    Créez une proposition commerciale pour ce projet
                </p>
                <UButton icon="i-lucide-plus" color="primary" label="Créer une proposition" @click="showForm = true" />
            </div>
        </div>
    </UCard>
</template>

<script lang="ts" setup>
import { useProject } from '~/composables/projects/useProject'
import { useProposalManager } from '~/composables/proposals/useProposalManager'
import { useModuleState } from '~/composables/shared/useModuleState'
import type { ProjectPaymentData, ProposalFormData } from '~/types/proposal'

interface Props {
    projectId: string
    projectInitialPrice?: number
}

interface Emits {
    (e: 'proposal-configured'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Utiliser le state centralisé pour le showForm
const { moduleConfig, configureModule, enableModule } = useModuleState(props.projectId)
const showForm = computed({
    get: () => moduleConfig.value.proposal.showForm,
    set: (value: boolean) => {
        if (value) {
            enableModule('proposal', { showForm: true })
        } else {
            configureModule('proposal')
        }
    }
})

// Utiliser le composable unifié
const proposalManager = useProposalManager(props.projectId)

// Use project composable pour les données de paiement
const { project, fetchProject, loading: projectLoading } = useProject(props.projectId)

// Computed for project payment data
const projectPaymentData = computed(() => {
    if (!project.value) return undefined

    return {
        id: project.value.id,
        payment_method: project.value.payment_method,
        bank_iban: project.value.bank_iban,
        bank_bic: project.value.bank_bic,
        bank_beneficiary: project.value.bank_beneficiary,
    }
})

// Computed properties
const contentKey = computed(() => {
    if (!proposalManager.proposal.value) return 'no-proposal'
    return `proposal-${proposalManager.proposal.value.id}-${proposalManager.proposal.value.updated_at}`
})

const revisionComment = computed(() => {
    return proposalManager.proposal.value?.revision_last_comment || null
})

// Charger la proposition au montage
onMounted(async () => {
    await Promise.all([
        proposalManager.load(),
        fetchProject()
    ])
})

// Méthodes
const handleSaved = () => {
    configureModule('proposal')
    emit('proposal-configured')

    const toast = useToast()
    toast.add({
        title: 'Proposition sauvegardée',
        description: 'La proposition a été créée/mise à jour avec succès.',
        icon: 'i-lucide-check-circle',
        color: 'success'
    })
}

const handleProposalSaved = async (data: {
    proposal: ProposalFormData;
    project: ProjectPaymentData;
    projectUpdated: boolean
}) => {
    try {
        // Utiliser directement les méthodes du service comme le fait l'ancien composable
        const { proposalService } = await import('~/services/proposalService')

        // Préparer les données de la proposition
        const proposalData = {
            project_id: props.projectId,
            content_json: data.proposal.content_json,
            content_html: data.proposal.content_html,
            price: data.proposal.price,
            deposit_required: data.proposal.deposit_required,
            deposit_amount: data.proposal.deposit_amount || null,
            contract_url: data.proposal.contract_url || null,
            quote_url: data.proposal.quote_url || null,
            status: data.projectUpdated ? 'awaiting_client' as const : 'draft' as const,
            revision_last_comment: null,
        }

        let _result
        if (proposalManager.proposal.value?.id) {
            // Mise à jour
            _result = await proposalService.updateProposal(
                proposalManager.proposal.value.id,
                proposalData,
                data.projectUpdated
            )
        } else {
            // Création
            _result = await proposalService.createProposal(proposalData, data.projectUpdated)
        }

        // Mettre à jour le projet si nécessaire
        if (data.project && (data.project.payment_method || data.project.bank_iban || data.project.bank_bic || data.project.bank_beneficiary)) {
            const { projectService } = await import('~/services/projectService')
            await projectService.updateProject(props.projectId, data.project)
        }

        // Recharger les données du proposalManager pour synchroniser
        await proposalManager.load()

        handleSaved()
    } catch (err) {
        console.error('Error saving proposal:', err)
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la sauvegarde.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

const handleDelete = async () => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette proposition ? Cette action est irréversible.')
    if (!confirmed) return

    try {
        await proposalManager.remove()
        const toast = useToast()
        toast.add({
            title: 'Proposition supprimée',
            description: 'La proposition a été supprimée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })
    } catch {
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la suppression.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

const handleConfirmPayment = async () => {
    try {
        await proposalManager.confirmPayment()
        const toast = useToast()
        toast.add({
            title: 'Paiement confirmé',
            description: 'La proposition a été validée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })
    } catch {
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: 'Erreur lors de la confirmation du paiement.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

const handleFileError = (error: string) => {
    console.error('Error opening file:', error)
}
</script>