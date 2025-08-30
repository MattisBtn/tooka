<template>
    <div class="space-y-6">
        <!-- Loading State -->
        <div v-if="proposalStore.isLoading" class="py-8 text-center">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
            <p class="text-sm text-neutral-600 dark:text-neutral-400">Chargement de la proposition...</p>
        </div>

        <!-- Error State -->
        <UAlert v-else-if="proposalStore.hasError" color="error" variant="soft" icon="i-lucide-alert-circle"
            :title="proposalStore.error?.message" />

        <!-- Existing Proposal -->
        <div v-else-if="proposalStore.exists" class="space-y-4">
            <UCard variant="outline">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-file-text" class="w-5 h-5 text-white dark:text-black" />
                            </div>
                            <div>
                                <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                    Proposition
                                </h3>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    Configuration de la proposition
                                </p>
                            </div>
                        </div>

                        <!-- Status Stepper in Header -->
                        <ProjectSharedWorkflowSteps :current-status="proposalStore.proposal?.status || 'draft'"
                            type="proposal" />
                    </div>
                </template>

                <div class="space-y-8">
                    <!-- Proposal Information -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-info" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Informations générales
                                </h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">Détails de la proposition</p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-neutral-600 dark:text-neutral-400">Options créées</span>
                                <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    {{ proposalStore.optionCount }} option{{ proposalStore.optionCount > 1 ? 's' : '' }}
                                </span>
                            </div>

                            <div v-if="proposalStore.selectedOption" class="flex items-center justify-between">
                                <span class="text-sm text-neutral-600 dark:text-neutral-400">Option sélectionnée</span>
                                <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    {{ proposalStore.selectedOption.title }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Options Preview -->
                    <div v-if="proposalStore.hasOptions" class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-list" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Aperçu des options</h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    {{ proposalStore.optionCount }} option{{ proposalStore.optionCount > 1 ? 's' : '' }}
                                    de proposition
                                </p>
                            </div>
                        </div>
                        <!-- TODO: Add options grid component -->
                    </div>

                    <!-- Revision Comment -->
                    <div v-if="proposalStore.proposal?.status === 'revision_requested' && proposalStore.proposal?.revision_last_comment"
                        class="space-y-3">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-message-circle" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Commentaire de révision
                                </h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">Demande de modification du
                                    client</p>
                            </div>
                        </div>

                        <div
                            class="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                            <p
                                class="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed break-words whitespace-pre-line">
                                {{ proposalStore.proposal.revision_last_comment }}
                            </p>
                        </div>
                    </div>

                </div>

                <template #footer>
                    <div class="flex items-center justify-between">
                        <!-- Secondary Actions -->
                        <div class="flex items-center gap-1">
                            <UTooltip
                                v-if="(proposalStore.proposal?.status === 'draft' || proposalStore.proposal?.status === 'awaiting_client') && !isProjectCompleted"
                                text="Supprimer la proposition">
                                <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error"
                                    :loading="proposalStore.loading" @click="handleDelete" />
                            </UTooltip>
                        </div>

                        <!-- Primary Actions -->
                        <div class="flex items-center gap-2">
                            <UButton v-if="proposalStore.canEdit && !isProjectCompleted" icon="i-lucide-edit" size="sm"
                                variant="outline" color="neutral" label="Modifier" @click="proposalStore.openForm()" />

                            <!-- Main CTA based on status -->
                            <UButton
                                v-if="(proposalStore.proposal?.status === 'draft' || proposalStore.proposal?.status === 'revision_requested') && !isProjectCompleted"
                                icon="i-lucide-send" size="sm" variant="solid" color="primary" label="Envoyer au client"
                                :loading="proposalStore.loading" @click="sendToClient()" />

                            <UButton v-if="proposalStore.proposal?.status !== 'draft'" icon="i-lucide-external-link"
                                size="sm" label="Voir l'aperçu client" variant="ghost" color="neutral"
                                :to="`/proposal/${proposalStore.proposal?.id}`" target="_blank" />
                        </div>
                    </div>
                </template>
            </UCard>
        </div>

        <!-- Empty State with Create Option -->
        <div v-else class="py-8 text-center">
            <UCard variant="outline">
                <template #header>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                            <UIcon name="i-lucide-file-text" class="w-5 h-5 text-white dark:text-black" />
                        </div>
                        <div class="flex flex-col items-start">
                            <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                Proposition
                            </h3>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                Souhaitez-vous créer une proposition pour ce projet ?
                            </p>
                        </div>
                    </div>
                </template>

                <div class="space-y-6">
                    <!-- Feature explanation -->
                    <div
                        class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                        <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Qu'est-ce qu'une proposition
                            ?</h4>
                        <ul class="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Devis détaillé avec plusieurs options tarifaires</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Sélection par le client de l'option préférée</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Gestion des informations de facturation</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Workflow complet jusqu'au paiement</span>
                            </li>
                        </ul>
                    </div>

                    <!-- Create button -->
                    <UButton v-if="!isProjectCompleted" icon="i-lucide-plus" color="primary" size="lg"
                        class="w-full sm:w-auto" :loading="proposalStore.formLoading" @click="proposalStore.openForm()">
                        Oui, créer une proposition
                    </UButton>
                    <UTooltip v-else
                        text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                        <UButton icon="i-lucide-plus" color="primary" size="lg" class="w-full sm:w-auto"
                            :loading="proposalStore.formLoading" disabled>
                            Oui, créer une proposition
                        </UButton>
                    </UTooltip>
                </div>
            </UCard>
        </div>
    </div>

    <!-- Proposal Form Modal -->
    <UModal v-model:open="proposalStore.showForm" :title="modalTitle" :close="{ color: 'neutral', variant: 'ghost' }"
        :ui="{ content: 'w-[calc(100vw-2rem)] max-w-4xl' }">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-highlighted">{{ modalTitle }}</h3>
                    <p class="text-sm text-muted">
                        {{ proposalStore.exists ?
                            'Modifiez les détails de votre proposition' :
                            'Créez une proposition avec plusieurs options tarifaires' }}
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <ProjectProposalForm :proposal="proposalStore.proposal || undefined"
                :project-id="projectSetupStore.project?.id || ''" @proposal-saved="handleProposalSaved"
                @cancel="proposalStore.closeForm()" />
        </template>
    </UModal>
</template>

<script lang="ts" setup>
import type { ProposalFormData } from '~/types/proposal'


// Use stores
const projectSetupStore = useProjectSetupStore()
const proposalStore = useProposalStore()

// Use store-level reactive flag
const isProjectCompleted = computed(() => projectSetupStore.isProjectCompleted)

// Modal title
const modalTitle = computed(() =>
    proposalStore.exists ? 'Modifier la proposition' : 'Créer une proposition'
)

// Initialize proposal store when project is loaded
watch(() => projectSetupStore.project, async (project) => {
    if (project?.id && project.proposal) {
        try {
            await proposalStore.loadProposal(project.id)
        } catch (err) {
            console.error('Error loading proposal:', err)
        }
    }
}, { immediate: true })

// Handle proposal saved
const handleProposalSaved = async (data: {
    proposal: Record<string, unknown>;
}) => {
    try {
        if (proposalStore.exists && proposalStore.proposal) {
            // Update existing proposal
            await proposalStore.updateProposal(
                proposalStore.proposal.id,
                data.proposal as ProposalFormData
            );
        } else {
            // Create new proposal
            await proposalStore.createProposal(
                projectSetupStore.project!.id,
                data.proposal as ProposalFormData
            );
        }

        const toast = useToast();
        toast.add({
            title: proposalStore.exists ? 'Proposition mise à jour' : 'Proposition créée',
            description: 'La proposition a été sauvegardée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        });
    } catch (err) {
        console.error('Error saving proposal:', err);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la sauvegarde.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
};

const sendToClient = async () => {
    if (!proposalStore.proposal) return;

    try {
        await proposalStore.sendToClient(proposalStore.proposal.id)

        const toast = useToast();
        toast.add({
            title: 'Proposition envoyée',
            description: 'La proposition a été envoyée au client.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        });
    } catch (err) {
        console.error('Error sending proposal:', err);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de l\'envoi.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
};

const handleDelete = async () => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette proposition ? Cette action est irréversible.')
    if (!confirmed || !proposalStore.proposal) return

    try {
        await proposalStore.deleteProposal(proposalStore.proposal.id)

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
</script>
