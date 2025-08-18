<template>
    <UForm id="client-form" :schema="schema" :state="state" class="space-y-6" @submit="handleSubmit">
        <!-- Type Selection - Only show for new clients -->
        <div v-if="!isEditMode" class="space-y-4">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-user-group" class="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Type de client</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Choisissez le type de client à créer</p>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div v-for="item in clientTypeItems" :key="item.value" :class="[
                    'group relative cursor-pointer rounded-lg p-4 transition-all duration-200 border-2',
                    state.type === item.value
                        ? 'border-primary bg-primary-50 dark:bg-primary-950 shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600 hover:shadow-sm'
                ]" @click="changeClientType(item.value as 'individual' | 'company')">
                    <!-- Selection indicator -->
                    <div v-if="state.type === item.value" class="absolute -top-1 -right-1">
                        <div class="w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-sm">
                            <UIcon name="i-heroicons-check" class="w-2.5 h-2.5 text-white" />
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <!-- Icon -->
                        <div :class="[
                            'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                            state.type === item.value
                                ? 'text-white bg-primary shadow-sm'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700'
                        ]">
                            <UIcon :name="item.icon" class="w-5 h-5" />
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <h3 :class="[
                                'font-semibold text-sm transition-colors duration-200',
                                state.type === item.value
                                    ? 'text-primary'
                                    : 'text-neutral-900 dark:text-neutral-100'
                            ]">
                                {{ item.label }}
                            </h3>
                            <p :class="[
                                'text-xs transition-colors duration-200',
                                state.type === item.value
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-neutral-600 dark:text-neutral-400'
                            ]">
                                {{ item.description }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <USeparator v-if="!isEditMode" />

        <!-- Individual Fields -->
        <div v-if="isIndividual" class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-user" class="w-4 h-4 text-white dark:text-black" />
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
                    <UInput v-model="state.first_name" placeholder="Jean" icon="i-heroicons-user" class="w-full" />
                </UFormField>

                <UFormField label="Nom" name="last_name" required>
                    <UInput v-model="state.last_name" placeholder="Dupont" icon="i-heroicons-user" class="w-full" />
                </UFormField>
            </div>
        </div>

        <!-- Company Fields -->
        <div v-if="isCompany" class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-building-office" class="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations entreprise
                    </h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Détails de l'entreprise ou société</p>
                </div>
            </div>

            <UFormField label="Nom de l'entreprise" name="company_name" required>
                <UInput v-model="state.company_name" placeholder="ACME Corporation" icon="i-heroicons-building-office"
                    class="w-full" />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="SIRET" name="siret" hint="optional">
                    <UInput v-model="state.siret" placeholder="12345678901234" icon="i-heroicons-document-text"
                        class="w-full" />
                </UFormField>

                <UFormField label="Numéro TVA" name="tax_id" hint="optional">
                    <UInput v-model="state.tax_id" placeholder="FR12345678901" icon="i-heroicons-receipt-percent"
                        class="w-full" />
                </UFormField>
            </div>
        </div>

        <USeparator />

        <!-- Contact Information -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-at-symbol" class="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations de contact
                    </h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Moyens de communication avec le client</p>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Email de facturation" name="billing_email" required
                    help="Utilisé pour notifier le client de l'avancement de son projet et envoyer les factures">
                    <UInput v-model="state.billing_email" placeholder="contact@exemple.com" type="email"
                        icon="i-heroicons-envelope" class="w-full" />
                </UFormField>

                <UFormField label="Téléphone" name="billing_phone" hint="optional">
                    <UInput v-model="state.billing_phone" placeholder="+33 1 23 45 67 89" type="tel"
                        icon="i-heroicons-phone" class="w-full" />
                </UFormField>
            </div>
        </div>

        <USeparator />

        <!-- Billing Address -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Adresse de facturation</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Où envoyer les factures et documents</p>
                </div>
            </div>

            <UFormField class="w-full" label="Adresse" name="billing_address" hint="optional">
                <UInput v-model="state.billing_address" placeholder="123 Rue de la Paix" icon="i-heroicons-home"
                    class="w-full" />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <UFormField label="Ville" name="billing_city" hint="optional">
                    <UInput v-model="state.billing_city" placeholder="Paris" icon="i-heroicons-building-office-2"
                        class="w-full" />
                </UFormField>

                <UFormField label="Code postal" name="billing_postal" hint="optional">
                    <UInput v-model="state.billing_postal" placeholder="75001" icon="i-heroicons-hashtag"
                        class="w-full" />
                </UFormField>

                <UFormField label="Pays" name="billing_country" hint="optional">
                    <UInput v-model="state.billing_country" placeholder="France" icon="i-heroicons-globe-alt"
                        class="w-full" />
                </UFormField>
            </div>
        </div>

        <USeparator />

        <!-- Notes -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Notes</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Informations complémentaires
                    </p>
                </div>
            </div>

            <UFormField label="Commentaires" name="notes" class="w-full" hint="optional">
                <UTextarea v-model="state.notes" placeholder="Ajoutez des informations complémentaires sur ce client..."
                    :rows="3" class="w-full" />
            </UFormField>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <UButton color="neutral" variant="ghost" label="Annuler" @click="emit('cancel')" />
            <UButton type="submit" color="primary" :loading="isSubmitting" :label="submitButtonLabel" />
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
    (e: 'cancel'): void;
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
        await onSubmit(event.data);
    } finally {
        isSubmitting.value = false;
    }
};
</script>