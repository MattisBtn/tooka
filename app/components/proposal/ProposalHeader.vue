<template>
    <header
        class="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Project Info -->
                <div class="flex items-center gap-4">
                    <div
                        class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <UIcon name="i-lucide-file-check" class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {{ project?.title }}
                        </h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Proposition commerciale
                        </p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-3">
                    <!-- Status badge -->
                    <UBadge v-if="proposal" :color="statusColor" variant="subtle" :label="statusLabel" />

                    <!-- Action buttons based on status -->
                    <template v-if="proposal && isAuthenticated">
                        <!-- Pay deposit button (for awaiting_client status with deposit required) -->
                        <UButton v-if="proposal.status === 'awaiting_client' && proposal.deposit_required"
                            icon="i-lucide-credit-card" color="success" size="sm" label="Payer l'acompte"
                            :loading="payingDeposit" @click="$emit('pay-deposit')" />

                        <!-- Accept button (for awaiting_client status WITHOUT deposit) -->
                        <UButton v-if="proposal.status === 'awaiting_client' && !proposal.deposit_required"
                            icon="i-lucide-check-circle" color="primary" size="sm" label="Accepter la proposition"
                            :loading="validatingProposal" @click="$emit('validate')" />

                        <!-- Request revisions button (for awaiting_client status) -->
                        <UButton v-if="proposal.status === 'awaiting_client'" icon="i-lucide-edit" variant="outline"
                            color="warning" size="sm" label="Demander des révisions" :loading="requestingRevisions"
                            @click="$emit('request-revisions')" />
                    </template>

                    <!-- Logout button for password-protected proposals -->
                    <UButton v-if="showLogoutButton" icon="i-lucide-log-out" variant="ghost" color="neutral" size="sm"
                        label="Se déconnecter" @click="$emit('logout')" />
                </div>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import type { Proposal } from '~/types/proposal';

interface Props {
    project?: {
        id: string;
        title: string;
        hasPassword: boolean;
    } | null;
    proposal?: Proposal | null;
    isAuthenticated: boolean;
    validatingProposal: boolean;
    requestingRevisions: boolean;
    payingDeposit: boolean;
    showLogoutButton?: boolean;
}

interface Emits {
    (e: 'validate' | 'request-revisions' | 'logout' | 'pay-deposit'): void;
}

const props = withDefaults(defineProps<Props>(), {
    showLogoutButton: false,
});

defineEmits<Emits>();

// Status display
const statusColor = computed(() => {
    if (!props.proposal) return 'neutral';

    switch (props.proposal.status) {
        case 'awaiting_client':
            return 'warning';
        case 'revision_requested':
            return 'info';
        case 'payment_pending':
            return 'info';
        case 'completed':
            return 'success';
        default:
            return 'neutral';
    }
});

const statusLabel = computed(() => {
    if (!props.proposal) return '';

    switch (props.proposal.status) {
        case 'awaiting_client':
            return 'En attente de votre réponse';
        case 'revision_requested':
            return 'Révisions demandées';
        case 'payment_pending':
            return 'Paiement en attente de confirmation';
        case 'completed':
            return 'Proposition acceptée';
        default:
            return '';
    }
});
</script>