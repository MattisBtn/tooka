<template>
    <UForm id="client-form" :schema="schema" :state="state" class="space-y-6" @submit="handleSubmit">
        <!-- Type Selection -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-user-group" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Type de client</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Choisissez le type de client à créer</p>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div v-for="item in clientTypeItems" :key="item.value" :class="[
                    'cursor-pointer border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-md',
                    state.type === item.value
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 dark:bg-primary-950 dark:border-primary-400 dark:ring-primary-800'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800'
                ]" @click="changeClientType(item.value as 'individual' | 'company')">
                    <div class="flex items-start gap-4">
                        <div :class="[
                            'flex items-center justify-center w-12 h-12 rounded-lg transition-colors',
                            state.type === item.value
                                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        ]">
                            <UIcon :name="item.icon" class="w-6 h-6" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-3">
                                <div class="flex-1 min-w-0">
                                    <h3 :class="[
                                        'font-semibold text-base',
                                        state.type === item.value ? 'text-primary-900 dark:text-primary-100' : 'text-neutral-900 dark:text-neutral-100'
                                    ]">
                                        {{ item.label }}
                                    </h3>
                                    <p :class="[
                                        'text-sm mt-1',
                                        state.type === item.value ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-600 dark:text-neutral-400'
                                    ]">
                                        {{ item.description }}
                                    </p>
                                </div>
                            </div>
                            <div v-if="state.type === item.value"
                                class="flex items-center gap-2 mt-3 text-xs font-medium text-primary-600 dark:text-primary-400">
                                <div class="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                                Sélectionné
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <USeparator />

        <!-- Individual Fields -->
        <div v-if="isIndividual" class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-user" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations personnelles
                    </h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Renseignez les informations de la personne
                    </p>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Prénom" name="first_name" required>
                    <UInput v-model="state.first_name" placeholder="Jean" icon="i-heroicons-user" />
                </UFormField>

                <UFormField label="Nom" name="last_name" required>
                    <UInput v-model="state.last_name" placeholder="Dupont" icon="i-heroicons-user" />
                </UFormField>
            </div>
        </div>

        <!-- Company Fields -->
        <div v-if="isCompany" class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-building-office" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations entreprise
                    </h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Détails de l'entreprise ou société</p>
                </div>
            </div>

            <UFormField label="Nom de l'entreprise" name="company_name" required>
                <UInput v-model="state.company_name" placeholder="ACME Corporation"
                    icon="i-heroicons-building-office" />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="SIRET" name="siret">
                    <UInput v-model="state.siret" placeholder="12345678901234" icon="i-heroicons-document-text" />
                </UFormField>

                <UFormField label="Numéro TVA" name="tax_id">
                    <UInput v-model="state.tax_id" placeholder="FR12345678901" icon="i-heroicons-receipt-percent" />
                </UFormField>
            </div>
        </div>

        <USeparator />

        <!-- Contact Information -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-at-symbol" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations de contact
                    </h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Moyens de communication avec le client</p>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Email de facturation" name="billing_email" required>
                    <UInput v-model="state.billing_email" placeholder="contact@exemple.com" type="email"
                        icon="i-heroicons-envelope" />
                </UFormField>

                <UFormField label="Téléphone" name="billing_phone">
                    <UInput v-model="state.billing_phone" placeholder="+33 1 23 45 67 89" type="tel"
                        icon="i-heroicons-phone" />
                </UFormField>
            </div>
        </div>

        <USeparator />

        <!-- Billing Address -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Adresse de facturation</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Où envoyer les factures et documents</p>
                </div>
            </div>

            <UFormField label="Adresse" name="billing_address" required>
                <UInput v-model="state.billing_address" placeholder="123 Rue de la Paix" icon="i-heroicons-home" />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <UFormField label="Ville" name="billing_city" required>
                    <UInput v-model="state.billing_city" placeholder="Paris" icon="i-heroicons-building-office-2" />
                </UFormField>

                <UFormField label="Code postal" name="billing_postal" required>
                    <UInput v-model="state.billing_postal" placeholder="75001" icon="i-heroicons-hashtag" />
                </UFormField>

                <UFormField label="Pays" name="billing_country" required>
                    <UInput v-model="state.billing_country" placeholder="France" icon="i-heroicons-globe-alt" />
                </UFormField>
            </div>
        </div>

        <!-- Payment Information (Company only) -->
        <div v-if="isCompany" class="space-y-4">
            <USeparator />
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations bancaires</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Coordonnées bancaires (optionnel)</p>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="IBAN" name="iban">
                    <UInput v-model="state.iban" placeholder="FR76 1234 5678 9012 3456 789"
                        icon="i-heroicons-credit-card" />
                </UFormField>

                <UFormField label="BIC" name="bic">
                    <UInput v-model="state.bic" placeholder="BNPAFRPP" icon="i-heroicons-building-library" />
                </UFormField>
            </div>
        </div>

        <USeparator />

        <!-- Notes -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Notes</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Informations complémentaires (optionnel)
                    </p>
                </div>
            </div>

            <UFormField label="Commentaires" name="notes" class="w-full">
                <UTextarea v-model="state.notes" placeholder="Ajoutez des informations complémentaires sur ce client..."
                    :rows="3" class="w-full" />
            </UFormField>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-heroicons-information-circle" class="w-4 h-4" />
                <span>Les champs marqués d'un <span class="text-red-500">*</span> sont obligatoires</span>
            </div>

            <div class="flex items-center gap-3">
                <UButton color="neutral" variant="ghost" label="Annuler" @click="$emit('cancel')" />
                <UButton type="submit" color="primary" :loading="isSubmitting" :label="submitButtonLabel" />
            </div>
        </div>
    </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { useClientForm } from "~/composables/clients/useClientForm";
import type { Client, ClientFormData, ClientTypeItem } from "~/types/client";
interface Props {
    client?: Client;
}

interface Emits {
    (e: "clientSaved", client: Client): void;
    (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const {
    state,
    schema,
    isIndividual,
    isCompany,
    isEditMode,
    changeClientType,
    onSubmit,
} = useClientForm(props.client);

// Local loading state for better UX
const isSubmitting = ref(false);

const clientTypeItems: ClientTypeItem[] = [
    {
        value: "individual",
        label: "Particulier",
        description: "Personne physique",
        icon: "i-heroicons-user",
    },
    {
        value: "company",
        label: "Professionnel",
        description: "Entreprise ou société",
        icon: "i-heroicons-building-office",
    },
];

const submitButtonLabel = computed(() =>
    isEditMode.value ? "Enregistrer" : "Créer le client"
);

// Handle form submission
const handleSubmit = async (event: FormSubmitEvent<ClientFormData>) => {
    isSubmitting.value = true;
    try {
        const result = await onSubmit(event.data);
        if (result) {
            emit("clientSaved", result);
        }
    } finally {
        isSubmitting.value = false;
    }
};
</script>