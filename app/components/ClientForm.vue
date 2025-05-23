<template>
    <UForm :schema="schema" :state="state" class="space-y-6" @submit="handleSubmit">
        <!-- Type Selection -->
        <div class="space-y-3">
            <label class="text-sm font-medium text-highlighted">Type de client</label>
            <URadioGroup v-model="state.type" :items="clientTypeItems" class="flex gap-4"
                @update:model-value="(value: string) => changeClientType(value as 'individual' | 'company')" />
        </div>

        <USeparator />

        <!-- Individual Fields -->
        <div v-if="isIndividual" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Prénom" name="first_name" required>
                <UInput v-model="state.first_name" placeholder="Jean" icon="i-lucide-user" />
            </UFormField>

            <UFormField label="Nom" name="last_name" required>
                <UInput v-model="state.last_name" placeholder="Dupont" icon="i-lucide-user" />
            </UFormField>
        </div>

        <!-- Company Fields -->
        <div v-if="isCompany" class="space-y-4">
            <UFormField label="Nom de l'entreprise" name="company_name" required>
                <UInput v-model="state.company_name" placeholder="ACME Corporation" icon="i-lucide-building" />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="SIRET" name="siret">
                    <UInput v-model="state.siret" placeholder="12345678901234" icon="i-lucide-file-text" />
                </UFormField>

                <UFormField label="Numéro TVA" name="tax_id">
                    <UInput v-model="state.tax_id" placeholder="FR12345678901" icon="i-lucide-receipt" />
                </UFormField>
            </div>
        </div>

        <USeparator />

        <!-- Contact Information -->
        <div class="space-y-4">
            <h3 class="text-base font-semibold text-highlighted">Informations de contact</h3>

            <UFormField label="Email de facturation" name="billing_email" required>
                <UInput v-model="state.billing_email" placeholder="contact@exemple.com" type="email"
                    icon="i-lucide-mail" />
            </UFormField>

            <UFormField label="Téléphone" name="billing_phone">
                <UInput v-model="state.billing_phone" placeholder="+33 1 23 45 67 89" type="tel"
                    icon="i-lucide-phone" />
            </UFormField>
        </div>

        <USeparator />

        <!-- Billing Address -->
        <div class="space-y-4">
            <h3 class="text-base font-semibold text-highlighted">Adresse de facturation</h3>

            <UFormField label="Adresse" name="billing_address" required>
                <UInput v-model="state.billing_address" placeholder="123 Rue de la Paix" icon="i-lucide-map-pin" />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <UFormField label="Ville" name="billing_city" required>
                    <UInput v-model="state.billing_city" placeholder="Paris" icon="i-lucide-map" />
                </UFormField>

                <UFormField label="Code postal" name="billing_postal" required>
                    <UInput v-model="state.billing_postal" placeholder="75001" icon="i-lucide-hash" />
                </UFormField>

                <UFormField label="Pays" name="billing_country" required>
                    <UInput v-model="state.billing_country" placeholder="France" icon="i-lucide-globe" />
                </UFormField>
            </div>
        </div>

        <!-- Payment Information (Company only) -->
        <div v-if="isCompany" class="space-y-4">
            <USeparator />
            <h3 class="text-base font-semibold text-highlighted">Informations bancaires (optionnel)</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="IBAN" name="iban">
                    <UInput v-model="state.iban" placeholder="FR76 1234 5678 9012 3456 789"
                        icon="i-lucide-credit-card" />
                </UFormField>

                <UFormField label="BIC" name="bic">
                    <UInput v-model="state.bic" placeholder="BNPAFRPP" icon="i-lucide-bank" />
                </UFormField>
            </div>
        </div>

        <USeparator />

        <!-- Notes -->
        <div class="space-y-4">
            <UFormField label="Notes (optionnel)" name="notes" class="w-full">
                <UTextarea v-model="state.notes" placeholder="Informations complémentaires..." :rows="3"
                    class="w-full" />
            </UFormField>
        </div>
    </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent, RadioGroupItem } from "@nuxt/ui";
import type { Client, ClientFormData } from "~/types/client";


interface Props {
    client?: Client;
}

interface Emits {
    (e: "clientSaved", client: Client): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const {
    state,
    schema,
    isIndividual,
    isCompany,
    changeClientType,
    onSubmit,
} = useClientForm(props.client);

const clientTypeItems: RadioGroupItem[] = [
    {
        value: "individual",
        label: "Particulier",
        description: "Personne physique",
        icon: "i-lucide-user",
    },
    {
        value: "company",
        label: "Professionnel",
        description: "Entreprise ou société",
        icon: "i-lucide-building",
    },
];

// Handle form submission
const handleSubmit = async (event: FormSubmitEvent<ClientFormData>) => {
    const result = await onSubmit(event.data);
    if (result) {
        emit("clientSaved", result);
    }
};
</script>