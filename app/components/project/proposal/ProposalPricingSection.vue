<template>
    <div class="space-y-4">
        <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <UIcon name="i-lucide-euro" class="w-4 h-4 text-white dark:text-black" />
            </div>
            <div>
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Tarification</h2>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">Prix et conditions de paiement</p>
            </div>
        </div>

        <UFormField label="Prix total" name="price" required>
            <UInput :model-value="price" type="number" placeholder="1500.00" step="0.01" min="0" icon="i-lucide-euro"
                :disabled="true" class="bg-neutral-50 dark:bg-neutral-800">
                <template #trailing>
                    <span class="text-neutral-500 dark:text-neutral-400 text-xs font-medium">€</span>
                </template>
            </UInput>
            <template #help>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                    Le prix est basé sur le tarif défini dans le projet
                </p>
            </template>
        </UFormField>

        <!-- Deposit Section -->
        <div class="space-y-4">
            <UFormField label="Acompte requis" name="deposit_required">
                <USwitch :model-value="depositRequired" color="primary" size="md"
                    @update:model-value="updateDepositRequired" />
            </UFormField>

            <div v-if="depositRequired" class="space-y-4 pl-4 border-l-2 border-primary-200 dark:border-primary-800">
                <!-- Payment Method -->
                <UFormField label="Méthode de paiement" name="payment_method" required>
                    <USelectMenu :model-value="projectPayment.payment_method || undefined" value-key="value"
                        :items="paymentMethodItems" placeholder="Choisir la méthode de paiement"
                        icon="i-lucide-credit-card" @update:model-value="updatePaymentMethod" />
                </UFormField>

                <UFormField label="Montant de l'acompte" name="deposit_amount" required>
                    <UInput :model-value="depositAmount" type="number" placeholder="450.00" step="0.01" min="0"
                        :max="price" icon="i-lucide-euro" @update:model-value="updateDepositAmount">
                        <template #trailing>
                            <div class="flex items-center gap-2">
                                <span class="text-neutral-500 dark:text-neutral-400 text-xs font-medium">€</span>
                                <span v-if="depositPercentage > 0"
                                    class="text-xs font-medium text-primary-600 dark:text-primary-400">
                                    ({{ depositPercentage }}%)
                                </span>
                            </div>
                        </template>
                    </UInput>
                </UFormField>

                <!-- Quick deposit buttons -->
                <div class="flex items-center gap-2">
                    <span class="text-sm text-neutral-600 dark:text-neutral-400">Rapide:</span>
                    <div class="flex gap-2">
                        <UButton v-for="option in quickDepositOptions" :key="option.value" size="xs" variant="outline"
                            color="primary" :label="option.label" @click="setDepositFromPercentage(option.value)" />
                    </div>
                </div>

                <!-- Bank Transfer Details removed: now sourced from user profile -->
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ProjectPaymentData } from "~/types/proposal";
// Synchronize payment methods with user store capabilities
const userStore = useUserStore();
const paymentMethodItems = computed(() => {
    const items: Array<{ value: string; label: string; disabled?: boolean }> = [];
    if (userStore.hasStripeConnect) {
        items.push({ value: 'stripe', label: 'Carte bancaire' });
    }
    if (userStore.hasBankingInfo) {
        items.push({ value: 'bank_transfer', label: 'Virement bancaire' });
    }
    return items;
});

interface Props {
    price: number;
    depositRequired: boolean;
    depositAmount: number | null;
    depositPercentage: number;
    quickDepositOptions: Array<{ label: string; value: number }>;
    projectPayment: ProjectPaymentData;
    setDepositFromPercentage: (percentage: number) => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'update:deposit-required': [value: boolean];
    'update:deposit-amount': [value: number | null];
    'update:project-payment': [value: ProjectPaymentData];
}>();

const updateDepositRequired = (value: boolean) => {
    emit('update:deposit-required', value);
};

const updateDepositAmount = (value: number | null) => {
    emit('update:deposit-amount', value);
};

const updatePaymentMethod = (value: string) => {
    emit('update:project-payment', { ...props.projectPayment, payment_method: value as 'stripe' | 'bank_transfer' | null });
};
</script>