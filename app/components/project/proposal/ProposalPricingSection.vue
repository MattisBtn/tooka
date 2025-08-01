<template>
    <div class="space-y-4">
        <div class="flex items-center gap-3 mb-6">
            <div
                class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-lucide-euro" class="w-4 h-4 text-white" />
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
                        :items="paymentMethodOptions" placeholder="Choisir la méthode de paiement"
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

                <!-- Bank Transfer Details -->
                <div v-if="projectPayment.payment_method === 'bank_transfer'"
                    class="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                    <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-lucide-building-2" class="w-4 h-4 text-blue-600" />
                        <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Coordonnées bancaires pour le virement
                        </span>
                    </div>

                    <UFormField label="IBAN" name="bank_iban" required>
                        <UInput :model-value="projectPayment.bank_iban" placeholder="FR76 1234 5678 9012 3456 7890 123"
                            icon="i-lucide-credit-card" @update:model-value="updateBankIban" />
                    </UFormField>

                    <UFormField label="BIC/SWIFT" name="bank_bic" required>
                        <UInput :model-value="projectPayment.bank_bic" placeholder="EXAMPLEFR1" icon="i-lucide-building"
                            @update:model-value="updateBankBic" />
                    </UFormField>

                    <UFormField label="Bénéficiaire" name="bank_beneficiary" required>
                        <UInput :model-value="projectPayment.bank_beneficiary" placeholder="Votre Entreprise SARL"
                            icon="i-lucide-user" @update:model-value="updateBankBeneficiary" />
                    </UFormField>

                    <UAlert color="info" variant="soft" icon="i-lucide-info">
                        <template #description>
                            Ces coordonnées seront transmises au client pour effectuer le virement d'acompte.
                        </template>
                    </UAlert>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ProjectPaymentData } from "~/types/proposal";

interface Props {
    price: number;
    depositRequired: boolean;
    depositAmount: number | null;
    depositPercentage: number;
    quickDepositOptions: Array<{ label: string; value: number }>;
    paymentMethodOptions: Array<{ value: string; label: string; disabled?: boolean }>;
    projectPayment: ProjectPaymentData;
    setDepositFromPercentage: (percentage: number) => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'update:depositRequired': [value: boolean];
    'update:depositAmount': [value: number | null];
    'update:projectPayment': [value: ProjectPaymentData];
}>();

const updateDepositRequired = (value: boolean) => {
    emit('update:depositRequired', value);
};

const updateDepositAmount = (value: number | null) => {
    emit('update:depositAmount', value);
};

const updatePaymentMethod = (value: string) => {
    emit('update:projectPayment', { ...props.projectPayment, payment_method: value as 'stripe' | 'bank_transfer' | null });
};

const updateBankIban = (value: string | null) => {
    emit('update:projectPayment', { ...props.projectPayment, bank_iban: value });
};

const updateBankBic = (value: string | null) => {
    emit('update:projectPayment', { ...props.projectPayment, bank_bic: value });
};

const updateBankBeneficiary = (value: string | null) => {
    emit('update:projectPayment', { ...props.projectPayment, bank_beneficiary: value });
};
</script>