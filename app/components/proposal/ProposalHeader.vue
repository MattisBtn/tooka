<template>
    <header
        class="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Logo and Project Info -->
                <div class="flex items-center gap-4 min-w-0 flex-1">
                    <NuxtImg :src="logoSrc" alt="Tooka" class="h-6 w-auto" />
                    <UBadge v-if="proposal" :color="statusColor" variant="soft" size="sm">
                        <UIcon :name="statusIcon" class="w-3 h-3 mr-1" />
                        {{ statusLabel }}
                    </UBadge>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-3">

                    <!-- Action buttons based on status -->
                    <template v-if="proposal && isAuthenticated">
                        <!-- Pay deposit button (for awaiting_client status with deposit required) -->
                        <UButton
                            v-if="proposal.status === 'awaiting_client' && proposal.deposit_required && project?.paymentMethod"
                            :icon="project.paymentMethod === 'stripe' ? 'i-lucide-credit-card' : 'i-lucide-banknote'"
                            :color="project.paymentMethod === 'stripe' ? 'primary' : 'primary'" size="sm"
                            :label="project.paymentMethod === 'stripe' ? 'Payer avec Stripe' : 'Payer l\'acompte'"
                            :loading="confirmingPayment" @click="$emit('pay-deposit')" />

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
import { useLogo } from '~/composables/shared/useLogo';
import type { Proposal } from '~/types/proposal';

interface Props {
    project?: {
        id: string;
        title: string;
        hasPassword: boolean;
        paymentMethod?: "stripe" | "bank_transfer" | null;
    } | null;
    proposal?: Proposal | null;
    isAuthenticated: boolean;
    validatingProposal: boolean;
    requestingRevisions: boolean;
    confirmingPayment: boolean;
    showLogoutButton?: boolean;
}

interface Emits {
    (e: 'validate' | 'request-revisions' | 'logout' | 'pay-deposit'): void;
}

const props = withDefaults(defineProps<Props>(), {
    showLogoutButton: false,
});

defineEmits<Emits>();

const { logoSrc } = useLogo()

// Status display
const statusConfig = {
    draft: { label: "Brouillon", color: "neutral" as const, icon: "i-lucide-file-text" },
    awaiting_client: { label: "En attente de votre réponse", color: "warning" as const, icon: "i-lucide-clock" },
    revision_requested: { label: "Révisions demandées", color: "info" as const, icon: "i-lucide-edit" },
    payment_pending: { label: "Paiement en attente de confirmation", color: "info" as const, icon: "i-lucide-credit-card" },
    completed: { label: "Proposition acceptée", color: "success" as const, icon: "i-lucide-check-circle" },
};

const statusLabel = computed(() =>
    statusConfig[props.proposal?.status || "draft"].label
);
const statusColor = computed(() =>
    statusConfig[props.proposal?.status || "draft"].color
);
const statusIcon = computed(() =>
    statusConfig[props.proposal?.status || "draft"].icon
);
</script>