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

                        <!-- Status Badge in Header -->
                        <div class="flex items-center gap-2">
                            <UBadge :color="statusColor" variant="soft" :label="statusLabel" />
                        </div>
                    </div>
                </template>

                <div class="space-y-6">
                    <!-- Pricing Information -->
                    <div v-if="!isFree" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Prix</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {{ formatPrice(proposalStore.proposal?.price) }}
                            </p>
                        </div>
                        <div v-if="proposalStore.proposal?.deposit_required" class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Acompte</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {{ formatPrice(proposalStore.proposal?.deposit_amount) }}
                            </p>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                {{ getDepositPercentage() }}% du prix total
                            </p>
                        </div>
                    </div>

                    <!-- Payment Method Info -->
                    <div v-if="!isFree && proposalStore.proposal?.deposit_required" class="space-y-3">
                        <div class="flex items-center gap-2">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Méthode
                                de
                                paiement</span>
                            <UBadge :color="getPaymentMethodColor()" variant="soft" :label="getPaymentMethodLabel()" />
                        </div>
                    </div>

                    <!-- Documents Info -->
                    <div class="space-y-3">
                        <div class="flex items-center gap-2">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Documents</span>
                            <UBadge :color="getDocumentsStatusColor()" variant="soft"
                                :label="getDocumentsStatusLabel()" />
                        </div>

                        <div v-if="hasDocuments()" class="space-y-2">
                            <div v-if="proposalStore.proposal?.contract_url"
                                class="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-orange-500" />
                                <span class="text-sm text-neutral-900 dark:text-neutral-100">Contrat joint</span>
                                <UButton icon="i-lucide-external-link" size="xs" variant="ghost" color="neutral"
                                    @click="openDocument(proposalStore.proposal!.contract_url!)" />
                            </div>
                            <div v-if="proposalStore.proposal?.quote_url"
                                class="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-green-500" />
                                <span class="text-sm text-neutral-900 dark:text-neutral-100">Devis joint</span>
                                <UButton icon="i-lucide-external-link" size="xs" variant="ghost" color="neutral"
                                    @click="openDocument(proposalStore.proposal!.quote_url!)" />
                            </div>
                        </div>
                    </div>

                    <!-- Contextual Actions -->
                    <div
                        class="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700 justify-end">
                        <!-- Edit Action - Available for draft and revision_requested -->
                        <UTooltip v-if="proposalStore.canEdit && !isProjectCompleted" text="Modifier la proposition">
                            <UButton icon="i-lucide-edit" size="sm" variant="outline" color="neutral" label="Modifier"
                                @click="proposalStore.openForm()" />
                        </UTooltip>
                        <UTooltip v-else-if="proposalStore.canEdit && isProjectCompleted"
                            text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                            <UButton icon="i-lucide-edit" size="sm" variant="outline" color="neutral" label="Modifier"
                                disabled />
                        </UTooltip>

                        <!-- Preview Action - Available for all non-draft statuses -->
                        <UTooltip v-if="proposalStore.proposal?.status !== 'draft'" text="Voir l'aperçu client">
                            <UButton icon="i-lucide-external-link" size="sm" variant="outline" color="neutral"
                                label="Aperçu client" :to="`/proposal/${proposalStore.proposal?.id}`" target="_blank" />
                        </UTooltip>

                        <!-- Send to Client Action - Available for draft and revision_requested -->
                        <UTooltip
                            v-if="(proposalStore.proposal?.status === 'draft' || proposalStore.proposal?.status === 'revision_requested') && !isProjectCompleted"
                            text="Envoyer la proposition au client">
                            <UButton icon="i-lucide-send" size="sm" variant="solid" color="primary"
                                label="Envoyer au client" @click="sendToClient()" />
                        </UTooltip>
                        <UTooltip
                            v-else-if="(proposalStore.proposal?.status === 'draft' || proposalStore.proposal?.status === 'revision_requested') && isProjectCompleted"
                            text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                            <UButton icon="i-lucide-send" size="sm" variant="solid" color="primary"
                                label="Envoyer au client" disabled />
                        </UTooltip>

                        <!-- Mark as Completed Action - Only for payment_pending -->
                        <UTooltip v-if="proposalStore.proposal?.status === 'payment_pending' && !isProjectCompleted"
                            text="Marquer la proposition comme terminée">
                            <UButton icon="i-lucide-check-circle" size="sm" variant="solid" color="success"
                                label="Marquer comme terminé" @click="confirmPayment()" />
                        </UTooltip>
                        <UTooltip v-else-if="proposalStore.proposal?.status === 'payment_pending' && isProjectCompleted"
                            text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                            <UButton icon="i-lucide-check-circle" size="sm" variant="solid" color="success"
                                label="Marquer comme terminé" disabled />
                        </UTooltip>

                        <!-- Delete Action - Only for draft and awaiting_client -->
                        <UTooltip
                            v-if="(proposalStore.proposal?.status === 'draft' || proposalStore.proposal?.status === 'awaiting_client') && !isProjectCompleted"
                            text="Supprimer la proposition">
                            <UButton icon="i-lucide-trash-2" size="sm" variant="outline" color="error" label="Supprimer"
                                :loading="proposalStore.loading" @click="handleDelete" />
                        </UTooltip>
                        <UTooltip
                            v-else-if="(proposalStore.proposal?.status === 'draft' || proposalStore.proposal?.status === 'awaiting_client') && isProjectCompleted"
                            text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                            <UButton icon="i-lucide-trash-2" size="sm" variant="outline" color="error" label="Supprimer"
                                disabled />
                        </UTooltip>
                    </div>
                </div>
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

import type { Project } from "~/types/project";
import type { ProjectPaymentData, ProposalFormData } from "~/types/proposal";
import { formatPrice, getStatusColor } from "~/utils/formatters";

// Use stores
const projectSetupStore = useProjectSetupStore()
const proposalStore = useProposalStore()

// Hybrid computed properties: use proposalStore when available, fallback to projectSetupStore
const isProjectCompleted = computed(() => {
    if (proposalStore.proposal?.project) {
        // Mode modification : utiliser les données de la proposition
        return (proposalStore.proposal.project as Project).status === 'completed'
    } else {
        // Mode création : utiliser les données du projectSetupStore
        return projectSetupStore.isProjectCompleted
    }
})

const isFree = computed(() => {
    if (proposalStore.proposal?.project) {
        // Mode modification : utiliser les données de la proposition
        const price = proposalStore.proposal.project.initial_price as number | undefined
        return (price || 0) === 0
    } else {
        // Mode création : utiliser les données du projectSetupStore
        return projectSetupStore.isFree
    }
})

// Modal title
const modalTitle = computed(() =>
    proposalStore.exists ? 'Modifier la proposition' : 'Créer une proposition'
)

// Simple status helpers with explicit typing to avoid deep instantiation
const statusLabel = computed((): string => {
    const status = proposalStore.proposal?.status as string | undefined
    const map: Record<string, string> = {
        draft: 'Brouillon',
        awaiting_client: 'En attente client',
        revision_requested: 'Révision demandée',
        completed: 'Acceptée',
        payment_pending: 'Paiement en attente',
    }
    return map[status || 'draft'] ?? status ?? 'draft'
})

const statusColor = computed(() => {
    const status = proposalStore.proposal?.status as string | undefined
    return getStatusColor(status || 'draft')
})

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