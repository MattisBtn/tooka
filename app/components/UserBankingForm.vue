<template>
    <!-- Error Display -->
    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mb-6" @close="$emit('resetError')" />

    <!-- Banking Form -->
    <UForm id="banking-form" :schema="schema" :state="formState" class="space-y-6" @submit="$emit('submit', $event)">
        <UFormField label="Titulaire du compte" name="bank_account_holder">
            <UInput v-model="formState.bank_account_holder" placeholder="Jean Dupont" icon="i-heroicons-user" />
        </UFormField>

        <UFormField label="Nom de la banque" name="bank_name">
            <UInput v-model="formState.bank_name" placeholder="Banque Populaire" icon="i-heroicons-building-library" />
        </UFormField>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField label="IBAN" name="bank_iban">
                <UInput v-model="formState.bank_iban" placeholder="FR76 1234 5678 9012 3456 789"
                    icon="i-heroicons-credit-card" />
            </UFormField>

            <UFormField label="BIC" name="bank_bic">
                <UInput v-model="formState.bank_bic" placeholder="BNPAFRPP" icon="i-heroicons-building-library" />
            </UFormField>
        </div>

        <div class="flex items-center justify-end gap-3">
            <UButton v-if="hasChanges" color="neutral" variant="ghost" label="Annuler" :disabled="isSubmitting"
                @click="$emit('reset')" />
            <UButton type="submit" form="banking-form" color="primary" :loading="isSubmitting" label="Sauvegarder"
                :disabled="!hasChanges" />
        </div>
    </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import type { UserProfileFormData, UserProfileWithAuth } from '~/types/userProfile'

interface Props {
    profile: UserProfileWithAuth | null
    isSubmitting: boolean
    error: string | null
    hasChanges: boolean
    schema: z.ZodType<UserProfileFormData>
}

defineProps<Props>()

const formState = defineModel<UserProfileFormData>('formState', { required: true })

defineEmits<{
    submit: [event: FormSubmitEvent<UserProfileFormData>]
    reset: []
    resetError: []
}>()
</script>
