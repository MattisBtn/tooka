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
                                <UIcon name="i-lucide-file-check" class="w-5 h-5 text-white dark:text-black" />
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
                    <!-- Pricing Section -->
                    <div v-if="!isFree" class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-euro" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Informations tarifaires
                                </h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">Prix et conditions de paiement
                                </p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-neutral-600 dark:text-neutral-400">Prix</span>
                                <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    {{ formatPrice(proposalStore.proposal?.price) }}
                                </span>
                            </div>
                            <div v-if="proposalStore.proposal?.deposit_required"
                                class="flex items-center justify-between">
                                <div>
                                    <span class="text-sm text-neutral-600 dark:text-neutral-400">Acompte</span>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        {{ getDepositPercentage() }}% du prix total
                                    </p>
                                </div>
                                <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    {{ formatPrice(proposalStore.proposal?.deposit_amount) }}
                                </span>
                            </div>
                        </div>

                        <!-- Payment Method -->
                        <div v-if="proposalStore.proposal?.deposit_required" class="flex items-center justify-between">
                            <span class="text-sm text-neutral-600 dark:text-neutral-400">Méthode de paiement</span>
                            <UBadge :color="getPaymentMethodColor()" variant="soft" :label="getPaymentMethodLabel()" />
                        </div>
                    </div>

                    <!-- Documents Section -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div class="flex-1">
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Documents joints</h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">Fichiers associés à la
                                    proposition</p>
                            </div>
                            <UBadge :color="getDocumentsStatusColor()" variant="soft"
                                :label="getDocumentsStatusLabel()" />
                        </div>

                        <div v-if="hasDocuments()" class="space-y-2">
                            <div v-if="proposalStore.proposal?.contract_url" class="flex items-center justify-between">
                                <span class="text-sm text-neutral-900 dark:text-neutral-100">Contrat</span>
                                <UButton icon="i-lucide-external-link" size="xs" variant="ghost" color="neutral"
                                    @click="openDocument(proposalStore.proposal!.contract_url!)" />
                            </div>
                            <div v-if="proposalStore.proposal?.quote_url" class="flex items-center justify-between">
                                <span class="text-sm text-neutral-900 dark:text-neutral-100">Devis</span>
                                <UButton icon="i-lucide-external-link" size="xs" variant="ghost" color="neutral"
                                    @click="openDocument(proposalStore.proposal!.quote_url!)" />
                            </div>
                        </div>
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
                                @click="sendToClient()" />

                            <UButton
                                v-else-if="proposalStore.proposal?.status === 'payment_pending' && !isProjectCompleted"
                                icon="i-lucide-check-circle" size="sm" variant="solid" color="success"
                                label="Marquer comme terminé" @click="confirmPayment()" />

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
                            <UIcon name="i-lucide-file-check" class="w-5 h-5 text-white dark:text-black" />
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
                                <span>Devis avec contenu personnalisable</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Gestion des acomptes et paiements</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Signature électronique du client</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Fichiers joints (devis PDF, contrat)</span>
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
                    <UIcon name="i-lucide-file-check" class="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-highlighted">{{ modalTitle }}</h3>
                    <p class="text-sm text-muted">
                        {{ proposalStore.exists ?
                            'Modifiez les détails de votre proposition' :
                            'Créez une proposition avec devis et contrat' }}
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <ProjectProposalForm :proposal="proposalStore.proposal || undefined"
                :project="proposalStore.proposal?.project || projectSetupStore.project || undefined"
                :project-id="proposalStore.proposal?.project?.id || projectSetupStore.project?.id || ''"
                :project-initial-price="proposalStore.proposal?.project?.initial_price || projectSetupStore.project?.initial_price || 0"
                @proposal-saved="handleProposalSaved" @cancel="proposalStore.closeForm()" />
        </template>
    </UModal>
</template>

<script lang="ts" setup>

import type { ProjectPaymentData, ProposalFormData } from "~/types/proposal";
import { formatPrice } from "~/utils/formatters";

// Use stores
const projectSetupStore = useProjectSetupStore()
const proposalStore = useProposalStore()
// Hybrid computed properties
const isProjectCompleted = computed(() => {
    if (proposalStore.proposal?.project) {
        return proposalStore.proposal.project.status === 'completed'
    }
    return projectSetupStore.isProjectCompleted
})

const isFree = computed(() => {
    if (proposalStore.proposal?.project) {
        const price = proposalStore.proposal.project.initial_price
        return (price || 0) === 0
    }
    return projectSetupStore.isFree
})

// Modal title
const modalTitle = computed(() =>
    proposalStore.exists ? 'Modifier la proposition' : 'Créer une proposition'
)



// Load proposal when component is mounted
onMounted(async () => {
    const projectId = projectSetupStore.project?.id
    if (projectId && !proposalStore.exists) {
        try {
            await proposalStore.loadProposal(projectId)
        } catch (err) {
            console.error('Error loading proposal:', err)
        }
    }
})

// Handle proposal saved
const handleProposalSaved = async (data: {
    proposal: ProposalFormData;
    project: ProjectPaymentData;
    projectUpdated: boolean;
}) => {
    try {
        const isUpdate = proposalStore.exists && proposalStore.proposal;

        if (isUpdate) {
            // Update existing proposal
            await proposalStore.updateProposal(
                proposalStore.proposal!.id,
                data.proposal,
                data.project,
                isFree.value
            );
        } else {
            // Create new proposal - use projectSetupStore data
            await proposalStore.createProposal(
                projectSetupStore.project!.id,
                data.proposal,
                data.project,
                projectSetupStore.isFree
            );


        }

        proposalStore.closeForm();
        const toast = useToast();
        toast.add({
            title: isUpdate ? 'Proposition mise à jour' : 'Proposition créée',
            description: 'La proposition a été sauvegardée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        });
    } catch (err) {
        console.error('Error saving proposal:', err);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors de la sauvegarde.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
};



const getDepositPercentage = () => {
    if (!proposalStore.proposal?.deposit_amount || !proposalStore.proposal?.price) return 0;
    return Math.round((proposalStore.proposal.deposit_amount / proposalStore.proposal.price) * 100);
}

const getPaymentMethodColor = () => {
    const method = proposalStore.proposal?.project?.payment_method || projectSetupStore.project?.payment_method;
    if (method === 'bank_transfer') return 'info';
    if (method === 'stripe') return 'success';
    return 'neutral';
}

const getPaymentMethodLabel = () => {
    const method = proposalStore.proposal?.project?.payment_method || projectSetupStore.project?.payment_method;
    if (method === 'bank_transfer') return 'Virement bancaire';
    if (method === 'stripe') return 'Carte bancaire';
    return 'Non défini';
}

const hasDocuments = () => {
    return !!(proposalStore.proposal?.contract_url || proposalStore.proposal?.quote_url);
}

const getDocumentsStatusColor = () => {
    if (hasDocuments()) return 'success';
    return 'neutral';
}

const getDocumentsStatusLabel = () => {
    if (hasDocuments()) return 'Documents joints';
    return 'Aucun document';
}



const sendToClient = async () => {
    if (!proposalStore.proposal) return;

    try {
        await proposalStore.sendToClient()

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
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'envoi.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
};

const confirmPayment = async () => {
    if (!proposalStore.proposal) return;

    try {
        await proposalStore.confirmPayment();

        const toast = useToast();
        toast.add({
            title: 'Proposition terminée',
            description: 'La proposition a été marquée comme terminée.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        });
    } catch (err) {
        console.error('Error confirming payment:', err);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
}

const openDocument = async (url: string) => {
    try {
        // Si c'est déjà une URL complète (commence par http), l'ouvrir directement
        if (url.startsWith('http')) {
            window.open(url, '_blank');
            return;
        }

        // L'URL reçue est déjà le chemin dans le bucket Supabase
        // Obtenir l'URL signée (bucket privé)
        const { proposalService } = await import('~/services/proposalService');
        const signedUrl = await proposalService.getSignedUrl(url);
        window.open(signedUrl, '_blank');
    } catch (err) {
        console.error('Error opening document:', err);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: 'Impossible d\'ouvrir le document.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
}

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
    } catch (err) {
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors de la suppression.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}
</script>