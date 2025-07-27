<template>
    <UCard>
        <template #header>
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Profil utilisateur</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        Gérez vos informations personnelles et professionnelles
                    </p>
                </div>
                <UBadge v-if="profile" :color="isProfileComplete ? 'success' : 'warning'" variant="subtle">
                    {{ completionPercentage }}% complet
                </UBadge>
            </div>
        </template>

        <!-- Error Display -->
        <UAlert v-if="error" color="error" variant="soft" :title="error" class="mb-6" @close="$emit('resetError')" />

        <!-- Profile Form -->
        <UForm id="profile-form" :schema="schema" :state="formState" class="space-y-8"
            @submit="$emit('submit', $event)">
            <!-- Personal Information Section -->
            <div class="space-y-4">
                <div class="flex items-center gap-3 mb-6">
                    <div
                        class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <UIcon name="i-heroicons-user" class="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            Informations personnelles
                        </h2>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Votre nom et téléphone
                        </p>
                    </div>
                </div>



                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <UFormField label="Prénom" name="first_name" required>
                        <UInput v-model="formState.first_name" placeholder="Jean" icon="i-heroicons-user" />
                    </UFormField>

                    <UFormField label="Nom" name="last_name" required>
                        <UInput v-model="formState.last_name" placeholder="Dupont" icon="i-heroicons-user" />
                    </UFormField>

                    <UFormField label="Téléphone" name="phone" class="md:col-span-2">
                        <UInput v-model="formState.phone" v-maska="'+###############'" placeholder="+33123456789"
                            type="tel" icon="i-heroicons-phone" />
                    </UFormField>
                </div>
            </div>

            <USeparator />

            <!-- Company Information Section -->
            <div class="space-y-4">
                <div class="flex items-center gap-3 mb-6">
                    <div
                        class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <UIcon name="i-heroicons-building-office" class="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            Informations entreprise
                        </h2>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Détails de votre entreprise ou société
                        </p>
                    </div>
                </div>

                <div class="space-y-6">
                    <UFormField label="Rechercher une entreprise" name="company_search">
                        <UInputMenu :items="companySearchItems" placeholder="Rechercher une entreprise..."
                            :loading="isCompanySearchLoading" icon="i-heroicons-magnifying-glass"
                            :search-attributes="['label']" @update:search-term="onCompanySearch"
                            @update:model-value="onCompanySelect">
                            <template #empty>
                                <div class="p-2 text-sm text-neutral-500">
                                    {{ searchQuery.length < 3 ? 'Tapez au moins 3 caractères'
                                        : 'Aucune entreprise trouvée' }} </div>
                            </template>
                        </UInputMenu>
                    </UFormField>

                    <UFormField label="Nom de l'entreprise" name="company_name">
                        <UInput v-model="formState.company_name" placeholder="Nom de l'entreprise"
                            icon="i-heroicons-building-office" />
                    </UFormField>

                    <UFormField label="Adresse" name="company_address">
                        <UInput v-model="formState.company_address" placeholder="123 Rue de la Paix"
                            icon="i-heroicons-home" />
                    </UFormField>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <UFormField label="Ville" name="company_city">
                            <UInput v-model="formState.company_city" placeholder="Paris"
                                icon="i-heroicons-building-office-2" />
                        </UFormField>

                        <UFormField label="Code postal" name="company_postal_code">
                            <UInput v-model="formState.company_postal_code" placeholder="75001"
                                icon="i-heroicons-hashtag" />
                        </UFormField>

                        <UFormField label="Pays" name="company_country">
                            <UInput v-model="formState.company_country" placeholder="France"
                                icon="i-heroicons-globe-alt" />
                        </UFormField>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UFormField label="SIRET" name="company_siret">
                            <UInput v-model="formState.company_siret" placeholder="12345678901234"
                                icon="i-heroicons-document-text" />
                        </UFormField>

                        <UFormField label="Numéro TVA" name="company_tax_id">
                            <UInput v-model="formState.company_tax_id" placeholder="FR12345678901"
                                icon="i-heroicons-receipt-percent" />
                        </UFormField>
                    </div>
                </div>
            </div>

            <USeparator />

            <!-- Banking Information Section -->
            <div class="space-y-4">
                <div class="flex items-center gap-3 mb-6">
                    <div
                        class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            Informations bancaires
                        </h2>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Vos coordonnées bancaires pour les paiements
                        </p>
                    </div>
                </div>

                <div class="space-y-6">
                    <UFormField label="Titulaire du compte" name="bank_account_holder">
                        <UInput v-model="formState.bank_account_holder" placeholder="Jean Dupont"
                            icon="i-heroicons-user" />
                    </UFormField>

                    <UFormField label="Nom de la banque" name="bank_name">
                        <UInput v-model="formState.bank_name" placeholder="Banque Populaire"
                            icon="i-heroicons-building-library" />
                    </UFormField>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UFormField label="IBAN" name="bank_iban">
                            <UInput v-model="formState.bank_iban" placeholder="FR76 1234 5678 9012 3456 789"
                                icon="i-heroicons-credit-card" />
                        </UFormField>

                        <UFormField label="BIC" name="bank_bic">
                            <UInput v-model="formState.bank_bic" placeholder="BNPAFRPP"
                                icon="i-heroicons-building-library" />
                        </UFormField>
                    </div>
                </div>
            </div>
        </UForm>

        <template #footer>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <UIcon name="i-heroicons-information-circle" class="w-4 h-4" />
                    <span>Les champs marqués d'un <span class="text-red-500">*</span> sont obligatoires</span>
                </div>

                <div class="flex items-center gap-3">
                    <UButton v-if="hasChanges" color="neutral" variant="ghost" label="Annuler" :disabled="isSubmitting"
                        @click="$emit('reset')" />
                    <UButton type="submit" form="profile-form" color="primary" :loading="isSubmitting"
                        label="Sauvegarder" :disabled="!hasChanges" />
                </div>
            </div>
        </template>
    </UCard>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { refDebounced } from '@vueuse/core'
import { vMaska } from 'maska/vue'
import type { z } from 'zod'

import { useCompanySearch } from '~/composables/user/useCompanySearch'
import type { CompanySearchItem, UserProfileFormData, UserProfileWithAuth } from '~/types/userProfile'

interface Props {
    profile: UserProfileWithAuth | null
    isSubmitting: boolean
    error: string | null
    isProfileComplete: boolean
    completionPercentage: number
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

// Company search functionality
const { searchCompanies, fillCompanyData, isLoading: isCompanySearchLoading } = useCompanySearch()

const searchQuery = ref('')
const searchQueryDebounced = refDebounced(searchQuery, 300)
const companySearchItems = ref<CompanySearchItem[]>([])



// Watch debounced search query
watch(searchQueryDebounced, async (query) => {
    if (query.length >= 3) {
        companySearchItems.value = await searchCompanies(query)
    } else {
        companySearchItems.value = []
    }
})

const onCompanySearch = (query: string) => {
    searchQuery.value = query
}

const onCompanySelect = (item: CompanySearchItem | unknown) => {
    if (item && typeof item === 'object' && 'value' in item) {
        const companyData = fillCompanyData((item as CompanySearchItem).value)
        Object.assign(formState.value, companyData)
    }
}


</script>