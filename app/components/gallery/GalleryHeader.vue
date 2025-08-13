<template>
    <header v-if="gallery && isAuthenticated && project"
        class="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Logo and Project Info -->
                <div class="flex items-center gap-4 min-w-0 flex-1">
                    <NuxtImg :src="logoSrc" alt="Tooka" class="h-6 w-auto" />
                    <UBadge :color="statusColor" variant="soft" size="sm">
                        <UIcon :name="statusIcon || ''" class="w-3 h-3 mr-1" />
                        {{ statusLabel }}
                    </UBadge>
                </div>

                <!-- Actions and Controls -->
                <div class="flex items-center gap-3">
                    <!-- Client Actions -->
                    <div v-if="canShowClientActions" class="flex items-center gap-2">
                        <!-- Awaiting client actions -->
                        <template v-if="gallery?.status === 'awaiting_client'">
                            <!-- Pay remaining amount button (for galleries with payment required and remaining amount > 0) -->
                            <UButton v-if="hasRemainingAmount" color="primary" size="sm"
                                :icon="project?.paymentMethod === 'stripe' ? 'i-lucide-credit-card' : 'i-lucide-banknote'"
                                class="hidden sm:flex" :loading="confirmingPayment"
                                @click="$emit('pay-remaining-amount')">
                                <span class="hidden lg:inline">
                                    {{ project?.paymentMethod === 'stripe' ? 'Payer avec Stripe' : 'Payer le solde' }}
                                </span>
                                <span class="lg:hidden">
                                    {{ project?.paymentMethod === 'stripe' ? 'Stripe' : 'Payer' }}
                                </span>
                            </UButton>

                            <!-- Validate without payment or with payment already made -->
                            <UButton v-else color="primary" size="sm" icon="i-heroicons-check-circle"
                                class="hidden sm:flex" :loading="validatingGallery" @click="$emit('validate')">
                                <span class="hidden lg:inline">Valider la galerie</span>
                                <span class="lg:hidden">Valider</span>
                            </UButton>

                            <!-- Request revisions -->
                            <UButton color="warning" variant="outline" size="sm" icon="i-heroicons-pencil-square"
                                class="hidden sm:flex" :loading="requestingRevisions"
                                @click="$emit('request-revisions')">
                                <span class="hidden lg:inline">Demander des retouches</span>
                                <span class="lg:hidden">Retouches</span>
                            </UButton>
                        </template>

                        <!-- Payment pending status -->
                        <template v-if="gallery?.status === 'payment_pending'">
                            <UBadge color="info" variant="soft" size="sm">
                                <UIcon name="i-heroicons-clock" class="w-3 h-3 mr-1" />
                                Paiement en cours
                            </UBadge>
                        </template>

                        <!-- Completed gallery actions -->
                        <template v-if="gallery?.status === 'completed'">
                            <UButton color="primary" size="sm" icon="i-heroicons-arrow-down-tray" class="hidden sm:flex"
                                :loading="downloadingGallery" @click="$emit('download')">
                                <span class="hidden lg:inline">Télécharger tout</span>
                                <span class="lg:hidden">Télécharger</span>
                            </UButton>
                        </template>

                        <!-- Mobile Actions Drawer -->
                        <UDrawer v-if="canShowClientActions" class="sm:hidden">
                            <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="sm" />

                            <template #content>
                                <div class="p-4 space-y-4">


                                    <!-- Awaiting client actions -->
                                    <template v-if="gallery?.status === 'awaiting_client'">
                                        <!-- Pay remaining amount -->
                                        <UButton v-if="hasRemainingAmount" color="primary" variant="solid" size="lg"
                                            :icon="project?.paymentMethod === 'stripe' ? 'i-lucide-credit-card' : 'i-lucide-banknote'"
                                            block :loading="confirmingPayment" @click="$emit('pay-remaining-amount')">
                                            {{ project?.paymentMethod === 'stripe' ?
                                                'Payer avec Stripe' :
                                                'Payer le solde' }}
                                        </UButton>

                                        <!-- Validate without payment -->
                                        <UButton v-else color="primary" variant="solid" size="lg"
                                            icon="i-heroicons-check-circle" block :loading="validatingGallery"
                                            @click="$emit('validate')">
                                            Valider la galerie
                                        </UButton>

                                        <!-- Request revisions -->
                                        <UButton color="warning" variant="outline" size="lg"
                                            icon="i-heroicons-pencil-square" block :loading="requestingRevisions"
                                            @click="$emit('request-revisions')">
                                            Demander des retouches
                                        </UButton>
                                    </template>

                                    <!-- Completed gallery actions -->
                                    <template v-if="gallery?.status === 'completed'">
                                        <UButton color="primary" variant="solid" size="lg"
                                            icon="i-heroicons-arrow-down-tray" block :loading="downloadingGallery"
                                            @click="$emit('download')">
                                            Télécharger tout
                                        </UButton>
                                    </template>
                                </div>
                            </template>
                        </UDrawer>
                    </div>

                    <!-- Logout button -->
                    <UButton v-if="showLogoutButton" icon="i-heroicons-arrow-left-on-rectangle" color="neutral"
                        variant="ghost" size="sm" title="Se déconnecter" @click="$emit('logout')" />

                    <!-- Dark mode toggle -->
                    <UButton :icon="isDarkMode ? 'i-heroicons-sun' : 'i-heroicons-moon'" color="neutral" variant="ghost"
                        size="sm" @click="toggleColorMode" />
                </div>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { useLogo } from "~/composables/shared/useLogo";
import { useStatus } from "~/composables/shared/useStatus";
import type { ClientGalleryAccess } from "~/types/gallery";
import { MODULE_STATUS } from "~/types/status";

interface Props {
    project: ClientGalleryAccess["project"] | null;
    gallery: ClientGalleryAccess["gallery"] | null;
    isAuthenticated: boolean;
    downloadingGallery: boolean;
    validatingGallery: boolean;
    requestingRevisions: boolean;
    confirmingPayment: boolean;
    hasRemainingAmount: boolean;
    formattedRemainingAmount: string | null;
    showLogoutButton?: boolean;
}

interface Emits {
    validate: [];
    "request-revisions": [];
    "pay-remaining-amount": [];
    download: [];
    logout: [];
}

const props = defineProps<Props>();
defineEmits<Emits>();

// Logo management
const { logoSrc } = useLogo()

// Color mode management
const colorMode = useColorMode();
const isDarkMode = computed(() => colorMode.value === 'dark');
const toggleColorMode = () => {
    colorMode.preference = isDarkMode.value ? 'light' : 'dark';
};

// Gallery status display
const { getStatusBadge } = useStatus();

const statusBadge = computed(() =>
    getStatusBadge(props.gallery?.status || MODULE_STATUS.DRAFT)
);

const statusLabel = computed(() => statusBadge.value.label);
const statusColor = computed(() => statusBadge.value.color);
const statusIcon = computed(() => statusBadge.value.icon);

// Client actions state
const canShowClientActions = computed(() =>
    props.gallery && (
        props.gallery.status === 'awaiting_client' ||
        props.gallery.status === 'completed' ||
        props.gallery.status === 'payment_pending'
    )
);
</script>