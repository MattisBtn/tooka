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
                            <div
                                class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-file-check" class="w-5 h-5 text-white" />
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
                            <UBadge :color="getStatusColor(proposalStore.proposal?.status)" variant="soft"
                                :label="getStatusLabel(proposalStore.proposal?.status || 'Inconnu', 'proposal')" />
                        </div>
                    </div>
                </template>

                <div class="space-y-6">
                    <!-- Pricing Information -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Prix</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {{ proposalStore.formattedPrice }}
                            </p>
                        </div>
                        <div v-if="proposalStore.proposal?.deposit_required" class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Acompte</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {{ proposalStore.formattedDepositAmount }}
                            </p>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                {{ getDepositPercentage() }}% du prix total
                            </p>
                        </div>
                    </div>

                    <!-- Payment Method Info -->
                    <div v-if="proposalStore.proposal?.deposit_required" class="space-y-3">
                        <div class="flex items-center gap-2">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Méthode
                                de
                                paiement</span>
                            <UBadge :color="getPaymentMethodColor()" variant="soft" :label="getPaymentMethodLabel()" />
                        </div>

                        <!-- Bank Transfer Details -->
                        <div v-if="projectSetupStore.project?.payment_method === 'bank_transfer'"
                            class="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <div class="flex items-center gap-2 mb-3">
                                <UIcon name="i-lucide-building-2" class="w-4 h-4 text-blue-600" />
                                <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    Coordonnées bancaires
                                </span>
                            </div>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-neutral-600 dark:text-neutral-400">IBAN:</span>
                                    <span class="font-mono text-neutral-900 dark:text-neutral-100">{{
                                        projectSetupStore.project?.bank_iban }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-600 dark:text-neutral-400">BIC/SWIFT:</span>
                                    <span class="font-mono text-neutral-900 dark:text-neutral-100">{{
                                        projectSetupStore.project?.bank_bic }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-600 dark:text-neutral-400">Bénéficiaire:</span>
                                    <span class="text-neutral-900 dark:text-neutral-100">{{
                                        projectSetupStore.project?.bank_beneficiary
                                    }}</span>
                                </div>
                            </div>
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
                        class="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700 ml-auto">
                        <!-- Edit Action - Available for draft and revision_requested -->
                        <UButton v-if="proposalStore.canEdit" icon="i-lucide-edit" size="sm" variant="outline"
                            color="neutral" label="Modifier" @click="proposalStore.openForm()" />

                        <!-- Preview Action - Available for all non-draft statuses -->
                        <UButton v-if="proposalStore.proposal?.status !== 'draft'" icon="i-lucide-external-link"
                            size="sm" variant="outline" color="neutral" label="Aperçu client"
                            :to="`/proposal/${proposalStore.proposal?.id}`" target="_blank" />

                        <!-- Send to Client Action - Only for draft -->
                        <UButton v-if="proposalStore.proposal?.status === 'draft'" icon="i-lucide-send" size="sm"
                            variant="solid" color="primary" label="Envoyer au client" @click="sendToClient()" />

                        <!-- Mark as Completed Action - Only for payment_pending -->
                        <UButton v-if="proposalStore.proposal?.status === 'payment_pending'"
                            icon="i-lucide-check-circle" size="sm" variant="solid" color="success"
                            label="Marquer comme terminé" @click="markAsCompleted()" />

                        <!-- Delete Action - Only for draft -->
                        <UButton v-if="proposalStore.proposal?.status === 'draft'" icon="i-lucide-trash-2" size="sm"
                            variant="outline" color="error" label="Supprimer" :loading="proposalStore.loading"
                            @click="handleDelete" />
                    </div>
                </div>
            </UCard>
        </div>

        <!-- Empty State with Create Option -->
        <div v-else class="py-8 text-center">
            <UCard variant="outline">
                <template #header>
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-lucide-file-check" class="w-5 h-5 text-white" />
                        </div>
                        <div>
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
                                <span>Devis détaillé avec contenu personnalisable</span>
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
                    <UButton icon="i-lucide-plus" color="primary" size="lg" class="w-full sm:w-auto"
                        :loading="proposalStore.formLoading" @click="proposalStore.openForm()">
                        Oui, créer une proposition
                    </UButton>
                </div>
            </UCard>
        </div>
    </div>

    <!-- Proposal Form Modal -->
    <UModal v-model:open="proposalStore.showForm" :fullscreen="true" :transition="true">
        <template #content>
            <div class="flex h-full bg-neutral-50 dark:bg-neutral-900">
                <!-- Form Content -->
                <div class="flex-1 flex flex-col">
                    <!-- Modal Header -->
                    <div class="p-6 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <UIcon name="i-lucide-file-check" class="w-6 h-6 text-emerald-600" />
                                <div>
                                    <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                        {{ proposalStore.exists ? 'Modifier la proposition' : 'Créer une proposition' }}
                                    </h2>
                                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                        Configurez les détails de votre proposition
                                    </p>
                                </div>
                            </div>
                            <UButton icon="i-lucide-x" size="sm" variant="ghost" color="neutral"
                                @click="proposalStore.closeForm()" />
                        </div>
                    </div>

                    <!-- Form Content -->
                    <div class="flex-1 p-6 overflow-y-auto">
                        <div class="max-w-4xl mx-auto">
                            <ProjectProposalForm :proposal="proposalStore.proposal || undefined"
                                :project="projectSetupStore.project || undefined"
                                :project-id="projectSetupStore.project?.id || ''"
                                :project-initial-price="projectSetupStore.project?.initial_price || 0"
                                @proposal-saved="handleProposalSaved" @cancel="proposalStore.closeForm()" />
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script lang="ts" setup>
import type { ProjectPaymentData, ProposalFormData } from "~/types/proposal";

// Use stores
const projectSetupStore = useProjectSetupStore()
const proposalStore = useProposalStore()

// Initialize proposal store when project is loaded
watch(() => projectSetupStore.project, async (project) => {
    if (project?.id) {
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
    project: Record<string, unknown>;
    projectUpdated: boolean;
}) => {
    try {
        if (proposalStore.exists && proposalStore.proposal) {
            // Update existing proposal
            await proposalStore.updateProposal(
                proposalStore.proposal.id,
                data.proposal as ProposalFormData,
                data.projectUpdated ? data.project as ProjectPaymentData : undefined
            );
        } else {
            // Create new proposal
            await proposalStore.createProposal(
                projectSetupStore.project!.id,
                data.proposal as ProposalFormData,
                data.projectUpdated ? data.project as ProjectPaymentData : undefined
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

// Helper functions
const getStatusColor = (status?: string): 'neutral' | 'info' | 'warning' | 'success' => {
    const colorMap: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = {
        draft: 'neutral',
        awaiting_client: 'info',
        revision_requested: 'warning',
        payment_pending: 'info',
        completed: 'success'
    }
    return colorMap[status || 'draft'] || 'neutral'
}

const getDepositPercentage = () => {
    if (!proposalStore.proposal?.deposit_amount || !proposalStore.proposal?.price) return 0;
    return Math.round((proposalStore.proposal.deposit_amount / proposalStore.proposal.price) * 100);
}

const getPaymentMethodColor = () => {
    const method = projectSetupStore.project?.payment_method;
    if (method === 'bank_transfer') return 'info';
    if (method === 'stripe') return 'success';
    return 'neutral';
}

const getPaymentMethodLabel = () => {
    const method = projectSetupStore.project?.payment_method;
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
        // Logique pour envoyer la proposition au client
        // Cela pourrait mettre à jour le statut vers 'awaiting_client'
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
}

const markAsCompleted = async () => {
    if (!proposalStore.proposal) return;

    try {
        // Logique pour marquer la proposition comme terminée
        // Cela pourrait mettre à jour le statut vers 'completed'
        const toast = useToast();
        toast.add({
            title: 'Proposition terminée',
            description: 'La proposition a été marquée comme terminée.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        });
    } catch (err) {
        console.error('Error marking as completed:', err);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la mise à jour.',
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