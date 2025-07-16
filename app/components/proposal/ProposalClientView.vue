<template>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Proposal Content -->
            <div
                class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <!-- Content Header -->
                <div
                    class="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 px-6 py-4 border-b border-emerald-200 dark:border-emerald-800">
                    <h2 class="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                        Détails de la proposition
                    </h2>
                    <p class="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                        {{ project?.title }}
                    </p>
                </div>

                <!-- Proposal Content Body -->
                <div class="p-6">
                    <!-- Generated HTML Content -->
                    <div v-if="proposal?.content_html" class="prose prose-neutral dark:prose-invert max-w-none mb-8"
                        v-html="proposal.content_html" />

                    <!-- Empty content fallback -->
                    <div v-else class="text-center py-8">
                        <UIcon name="i-lucide-file-text" class="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                        <p class="text-neutral-600 dark:text-neutral-400">Aucun contenu disponible</p>
                    </div>

                    <!-- Pricing Information -->
                    <div
                        class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700 mb-6">
                        <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                            <UIcon name="i-lucide-euro" class="w-5 h-5 text-emerald-600" />
                            Tarification
                        </h3>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <span
                                    class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                                    Prix total
                                </span>
                                <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                    {{ formattedPrice }}
                                </p>
                            </div>

                            <div v-if="hasDeposit" class="space-y-1">
                                <span
                                    class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                                    Acompte requis
                                </span>
                                <p class="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                                    {{ formattedDepositAmount }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- File Attachments -->
                    <div v-if="proposal?.contract_url || proposal?.quote_url" class="space-y-4 mb-6">
                        <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <UIcon name="i-lucide-paperclip" class="w-5 h-5 text-violet-600" />
                            Documents joints
                        </h3>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div v-if="proposal.contract_url"
                                class="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <div class="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                    <UIcon name="i-lucide-file-text" class="w-5 h-5 text-white" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="font-medium text-orange-900 dark:text-orange-100">Contrat</p>
                                    <p class="text-sm text-orange-700 dark:text-orange-300">Document contractuel</p>
                                </div>
                                <UButton icon="i-lucide-external-link" size="xs" variant="ghost" color="warning" />
                            </div>

                            <div v-if="proposal.quote_url"
                                class="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                    <UIcon name="i-lucide-file-text" class="w-5 h-5 text-white" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="font-medium text-green-900 dark:text-green-100">Devis</p>
                                    <p class="text-sm text-green-700 dark:text-green-300">Devis détaillé</p>
                                </div>
                                <UButton icon="i-lucide-external-link" size="xs" variant="ghost" color="success" />
                            </div>
                        </div>
                    </div>

                    <!-- Status Messages -->
                    <div v-if="proposal" class="space-y-3">
                        <!-- Awaiting client action -->
                        <UAlert v-if="proposal.status === 'awaiting_client'" color="warning" variant="soft"
                            icon="i-lucide-clock" title="Action requise">
                            <template #description>
                                Cette proposition attend votre réponse. Vous pouvez l'accepter ou demander des
                                modifications.
                            </template>
                        </UAlert>

                        <!-- Completed -->
                        <UAlert v-else-if="proposal.status === 'completed'" color="success" variant="soft"
                            icon="i-lucide-check-circle" title="Proposition acceptée">
                            <template #description>
                                Vous avez accepté cette proposition. Votre photographe va maintenant procéder à la suite
                                du projet.
                            </template>
                        </UAlert>

                        <!-- Revision requested -->
                        <UAlert v-else-if="proposal.status === 'revision_requested'" color="info" variant="soft"
                            icon="i-lucide-edit" title="Révisions demandées">
                            <template #description>
                                Vous avez demandé des modifications. Votre photographe va réviser la proposition et vous
                                la renvoyer.
                            </template>
                        </UAlert>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Proposal } from '~/types/proposal';

interface Props {
    proposalId: string;
    proposal?: Proposal | null;
    project?: {
        id: string;
        title: string;
        hasPassword: boolean;
    } | null;
    formattedPrice: string;
    formattedDepositAmount?: string | null;
    hasDeposit: boolean;
}

defineProps<Props>();
</script>

<!-- <style scoped>
/* Custom prose styles for the proposal content */
:deep(.prose) {
    @apply text-neutral-700 dark:text-neutral-300;
}

:deep(.prose h1) {
    @apply text-neutral-900 dark:text-neutral-100;
}

:deep(.prose h2) {
    @apply text-neutral-900 dark:text-neutral-100;
}

:deep(.prose h3) {
    @apply text-neutral-900 dark:text-neutral-100;
}
</style> -->