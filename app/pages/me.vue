<script setup lang="ts">
import type { FormSubmitEvent, TabsItem } from '@nuxt/ui'

import { useAuth } from '~/composables/auth/useAuth'
import { useUserProfile } from '~/composables/user/useUserProfile'
import type { UserProfileFormData } from '~/types/userProfile'

const { user } = useAuth()

// Use profile composable
const {
    profile,
    formState,
    isLoading,
    isSubmitting,
    error,
    isProfileComplete,
    completionPercentage,
    hasChanges,
    schema,
    onSubmit,
    resetForm,
    resetError,
} = useUserProfile()

// Define tabs for the profile page
const tabs = ref<TabsItem[]>([
    {
        label: 'Profile',
        icon: 'i-heroicons-user-circle',
        value: 'profile'
    },
    {
        label: 'Security',
        icon: 'i-heroicons-shield-check',
        value: 'security'
    },
    {
        label: 'Billing',
        icon: 'i-heroicons-credit-card',
        value: 'billing'
    }
])

const activeTab = ref('profile')

// Mock security settings
const securitySettings = ref({
    twoFactorEnabled: false,
    lastPasswordChange: '2024-01-15',
    activeSessions: 3
})

// Mock billing data
const billingData = ref({
    plan: 'Pro',
    nextBillingDate: '2024-02-15',
    amount: '€29.99',
    paymentMethod: '**** **** **** 4242'
})

// Handle form submission
const handleSubmit = async (event: FormSubmitEvent<UserProfileFormData>) => {
    await onSubmit(event)
}

useSeoMeta({
    title: 'Mon Profil',
    description: 'Gérez vos paramètres de profil et de compte'
})
</script>

<template>
    <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Mon Profil</h1>
            <p class="text-neutral-600 dark:text-neutral-400 mt-2">
                Gérez vos informations personnelles et paramètres de compte
            </p>
        </div>

        <!-- Profile Overview Card -->
        <UCard class="mb-8">
            <div v-if="isLoading" class="flex items-center justify-center py-8">
                <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary-500" />
                <span class="ml-2 text-neutral-600 dark:text-neutral-400">Chargement du profil...</span>
            </div>
            <div v-else class="flex items-center gap-6">
                <UAvatar :src="profile?.avatar_url || undefined"
                    :alt="(profile?.first_name || '') + ' ' + (profile?.last_name || '')" size="3xl" />
                <div class="flex-1">
                    <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {{ profile?.first_name || 'Prénom' }} {{ profile?.last_name || 'Nom' }}
                    </h2>
                    <p class="text-neutral-600 dark:text-neutral-400">{{ profile?.auth?.email || user?.email }}</p>
                    <p class="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
                        {{ profile?.company_name || 'Aucune entreprise' }}
                    </p>
                    <div class="flex items-center gap-2 mt-3">
                        <UBadge color="success" variant="subtle">Plan {{ billingData.plan }}</UBadge>
                        <UBadge color="info" variant="subtle">Membre depuis Jan 2024</UBadge>
                        <UBadge v-if="profile" :color="isProfileComplete ? 'success' : 'warning'" variant="subtle">
                            Profil {{ completionPercentage }}% complet
                        </UBadge>
                    </div>
                </div>
                <div class="text-right">
                    <UButton color="primary" variant="outline" size="sm">
                        Modifier la photo
                    </UButton>
                </div>
            </div>
        </UCard>

        <!-- Tabs Navigation -->
        <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #content="{ item }">
                <!-- Profile Tab -->
                <div v-if="item.value === 'profile'">
                    <UserProfileForm v-model:form-state="formState" :profile="profile" :is-submitting="isSubmitting"
                        :error="error" :is-profile-complete="isProfileComplete"
                        :completion-percentage="completionPercentage" :has-changes="hasChanges" :schema="schema"
                        @submit="handleSubmit" @reset="resetForm" @reset-error="resetError" />
                </div>

                <!-- Security Tab -->
                <div v-else-if="item.value === 'security'" class="space-y-6">
                    <UCard>
                        <template #header>
                            <h3 class="text-lg font-semibold">Sécurité</h3>
                        </template>

                        <div class="space-y-6">
                            <div>
                                <h4 class="font-medium mb-2">Mot de passe</h4>
                                <p class="text-sm text-neutral-500 mb-4">
                                    Dernière modification: {{ securitySettings.lastPasswordChange }}
                                </p>
                                <UButton color="primary" variant="outline" size="sm">
                                    Changer le mot de passe
                                </UButton>
                            </div>

                            <USeparator />

                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="font-medium">Authentification à deux facteurs</h4>
                                    <p class="text-sm text-neutral-500">Sécurisez votre compte avec un code de
                                        vérification</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <UBadge :color="securitySettings.twoFactorEnabled ? 'success' : 'warning'"
                                        variant="subtle">
                                        {{ securitySettings.twoFactorEnabled ? 'Activé' : 'Désactivé' }}
                                    </UBadge>
                                    <UButton color="primary" variant="outline" size="sm">
                                        {{ securitySettings.twoFactorEnabled ? 'Désactiver' : 'Activer' }}
                                    </UButton>
                                </div>
                            </div>

                            <USeparator />

                            <div>
                                <h4 class="font-medium mb-2">Sessions actives</h4>
                                <p class="text-sm text-neutral-500 mb-4">
                                    Vous avez {{ securitySettings.activeSessions }} sessions actives
                                </p>
                                <UButton color="error" variant="outline" size="sm">
                                    Déconnecter toutes les sessions
                                </UButton>
                            </div>
                        </div>
                    </UCard>
                </div>

                <!-- Billing Tab -->
                <div v-else-if="item.value === 'billing'" class="space-y-6">
                    <UCard>
                        <template #header>
                            <h3 class="text-lg font-semibold">Facturation</h3>
                        </template>

                        <div class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 class="font-medium mb-2">Plan actuel</h4>
                                    <div class="flex items-center gap-2">
                                        <UBadge color="success" variant="subtle" size="lg">{{ billingData.plan }}
                                        </UBadge>
                                        <UButton color="primary" variant="outline" size="sm">Changer de plan</UButton>
                                    </div>
                                </div>

                                <div>
                                    <h4 class="font-medium mb-2">Prochaine facturation</h4>
                                    <p class="text-neutral-600 dark:text-neutral-400">
                                        {{ billingData.nextBillingDate }} - {{ billingData.amount }}
                                    </p>
                                </div>
                            </div>

                            <USeparator />

                            <div>
                                <h4 class="font-medium mb-2">Méthode de paiement</h4>
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-heroicons-credit-card" class="text-neutral-500" />
                                        <span>{{ billingData.paymentMethod }}</span>
                                    </div>
                                    <UButton color="primary" variant="outline" size="sm">
                                        Modifier
                                    </UButton>
                                </div>
                            </div>

                            <USeparator />

                            <div>
                                <h4 class="font-medium mb-2">Historique de facturation</h4>
                                <UButton color="primary" variant="outline" size="sm">
                                    Voir l'historique
                                </UButton>
                            </div>
                        </div>
                    </UCard>
                </div>


            </template>
        </UTabs>
    </div>
</template>