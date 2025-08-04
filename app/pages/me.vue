<script setup lang="ts">
import type { FormSubmitEvent, TabsItem } from '@nuxt/ui'

import { useAuth } from '~/composables/auth/useAuth'
import { useStripeConnect } from '~/composables/user/useStripeConnect'
import { useUserProfile } from '~/composables/user/useUserProfile'
import { useSubscriptionStore } from '~/stores/subscription'
import type { SubscriptionPlan } from '~/types/subscription'
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

// Use Stripe Connect composable
const {
    isLoading: stripeLoading,
    error: stripeError,
    hasStripeAccount,
    isAccountComplete,
    canReceivePayments,
    accountStatusText,
    accountStatusColor,
    createStripeAccount,
    getDashboardLink,
    resetError: resetStripeError
} = useStripeConnect()

// Use subscription store directly
const subscriptionStore = useSubscriptionStore()

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
        value: 'security',
        disabled: true
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

// Handle form submission
const handleSubmit = async (event: FormSubmitEvent<UserProfileFormData>) => {
    await onSubmit(event)
}

// Avatar modal state
const isAvatarModalOpen = ref(false)

// Computed for avatar display - now uses only profile data
const currentAvatarUrl = computed(() => {
    return profile.value?.avatar_url || undefined
})

// Avatar alt text
const avatarAlt = computed(() => {
    if (profile.value?.first_name && profile.value?.last_name) {
        return `${profile.value.first_name} ${profile.value.last_name}`;
    }
    if (profile.value?.first_name) {
        return profile.value.first_name;
    }
    return user.value?.email || "Avatar";
})

// Open avatar modal
const openAvatarModal = () => {
    isAvatarModalOpen.value = true
}

// Subscription management
const isLoadingSubscription = ref(false)
const subscriptionError = ref<string | null>(null)
const currentPlan = ref<SubscriptionPlan | null>(null)

// Load subscription data
const loadSubscriptionData = async () => {
    if (!user.value?.id) return

    try {
        isLoadingSubscription.value = true
        subscriptionError.value = null
        await subscriptionStore.fetchCurrentSubscription(user.value.id)
        await subscriptionStore.fetchPlans()

        // Récupérer les informations du plan si disponible
        if (subscriptionStore.currentSubscription?.plan_id) {
            currentPlan.value = await subscriptionStore.getPlanById(subscriptionStore.currentSubscription.plan_id)
        }
    } catch (error) {
        subscriptionError.value = 'Erreur lors du chargement de l\'abonnement'
        console.error('Failed to load subscription:', error)
    } finally {
        isLoadingSubscription.value = false
    }
}

// Format subscription status
const formatSubscriptionStatus = (status: string | null) => {
    switch (status) {
        case 'active': return 'Actif'
        case 'trialing': return 'Essai'
        case 'past_due': return 'En retard'
        case 'canceled': return 'Annulé'
        case 'inactive': return 'Inactif'
        default: return 'Inconnu'
    }
}

// Get subscription status color
const getSubscriptionStatusColor = (status: string | null) => {
    switch (status) {
        case 'active': return 'success'
        case 'trialing': return 'info'
        case 'past_due': return 'warning'
        case 'canceled': return 'error'
        case 'inactive': return 'neutral'
        default: return 'neutral'
    }
}

// Format date
const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non défini'
    return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

// Load subscription data on mount
onMounted(() => {
    loadSubscriptionData()
})

// Subscription actions
const handlePortalAccess = async () => {
    if (!user.value?.id) return

    try {
        await subscriptionStore.createPortalSession(user.value.id)
    } catch (error) {
        console.error('Failed to access portal:', error)
    }
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
                <!-- Avatar - clickable to open modal -->
                <div class="relative cursor-pointer group" @click="openAvatarModal">
                    <UAvatar :src="currentAvatarUrl" :alt="avatarAlt" size="3xl"
                        class="ring-2 ring-neutral-200 dark:ring-neutral-700 transition-all group-hover:ring-primary-500" />

                    <!-- Overlay on hover -->
                    <div
                        class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <UIcon name="i-heroicons-camera" class="w-6 h-6 text-white" />
                    </div>
                </div>

                <div class="flex-1">
                    <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {{ profile?.first_name || 'Prénom' }} {{ profile?.last_name || 'Nom' }}
                    </h2>
                    <p class="text-neutral-600 dark:text-neutral-400">{{ profile?.auth?.email || user?.email }}</p>
                    <p class="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
                        {{ profile?.company_name || 'Aucune entreprise' }}
                    </p>
                    <div class="flex items-center gap-2 mt-3">
                        <UBadge v-if="profile" :color="isProfileComplete ? 'success' : 'warning'" variant="subtle">
                            Profil {{ completionPercentage }}% complet
                        </UBadge>
                    </div>
                </div>

                <div class="text-right">
                    <UButton color="primary" variant="outline" size="sm" @click="openAvatarModal">
                        <UIcon name="i-heroicons-camera" class="w-4 h-4 mr-1" />
                        Modifier la photo
                    </UButton>
                </div>
            </div>
        </UCard>

        <!-- Avatar Upload Modal -->
        <UserAvatarModal v-model="isAvatarModalOpen" />

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
                            <!-- Subscription Information -->
                            <div>
                                <h4 class="font-medium mb-2">Abonnement</h4>

                                <div v-if="isLoadingSubscription" class="flex items-center justify-center py-8">
                                    <UIcon name="i-heroicons-arrow-path"
                                        class="w-6 h-6 animate-spin text-primary-500" />
                                    <span class="ml-2 text-neutral-600 dark:text-neutral-400">Chargement de
                                        l'abonnement...</span>
                                </div>

                                <div v-else-if="subscriptionError" class="mb-4">
                                    <UAlert color="error" variant="subtle" :title="subscriptionError" />
                                </div>

                                <div v-else-if="subscriptionStore.currentSubscription" class="space-y-4">
                                    <!-- Current Plan -->
                                    <div
                                        class="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                        <div>
                                            <h5 class="font-medium">Plan actuel</h5>
                                            <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                                {{ currentPlan?.name || 'Plan inconnu' }}
                                            </p>
                                        </div>
                                        <UBadge
                                            :color="getSubscriptionStatusColor(subscriptionStore.currentSubscription.subscription_status)"
                                            variant="subtle">
                                            {{
                                                formatSubscriptionStatus(subscriptionStore.currentSubscription.subscription_status)
                                            }}
                                        </UBadge>
                                    </div>

                                    <!-- Subscription Details -->
                                    <div v-if="subscriptionStore.currentSubscription.subscription_end_date"
                                        class="space-y-2">
                                        <div class="flex justify-between text-sm">
                                            <span class="text-neutral-600 dark:text-neutral-400">
                                                {{ subscriptionStore.currentSubscription.subscription_status ===
                                                    'canceled' ?
                                                    'Expire le' :
                                                    'Prochaine facturation' }}:
                                            </span>
                                            <span>{{
                                                formatDate(subscriptionStore.currentSubscription.subscription_end_date)
                                            }}</span>
                                        </div>
                                    </div>

                                    <!-- Action Buttons -->
                                    <div class="flex gap-2">
                                        <UButton v-if="subscriptionStore.currentSubscription.stripe_subscription_id"
                                            color="primary" variant="outline" size="sm" @click="handlePortalAccess">
                                            Gérer l'abonnement
                                        </UButton>
                                        <UButton v-else-if="!subscriptionStore.hasValidSubscription" color="primary"
                                            variant="solid" size="sm" @click="navigateTo('/pricing')">
                                            Souscrire
                                        </UButton>
                                    </div>
                                </div>

                                <div v-else class="text-center py-8">
                                    <UIcon name="i-heroicons-credit-card"
                                        class="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                                    <p class="text-neutral-600 dark:text-neutral-400 mb-4">
                                        Aucun abonnement actif
                                    </p>
                                    <UButton color="primary" variant="solid" size="sm" @click="navigateTo('/pricing')">
                                        Voir les plans
                                    </UButton>
                                </div>
                            </div>

                            <USeparator />

                            <!-- Stripe Connect Section -->
                            <div>
                                <h4 class="font-medium mb-2">Recevoir des paiements avec Stripe</h4>
                                <div v-if="stripeError" class="mb-4">
                                    <UAlert color="error" variant="subtle" :title="stripeError"
                                        @close="resetStripeError">
                                        <template v-if="stripeError.includes('plus accessible')" #actions>
                                            <UButton color="error" variant="ghost" size="xs"
                                                @click="createStripeAccount">
                                                Créer un nouveau compte
                                            </UButton>
                                        </template>
                                    </UAlert>
                                </div>

                                <div v-if="!hasStripeAccount" class="space-y-3">
                                    <p class="text-sm text-neutral-500">
                                        Connectez votre compte Stripe pour recevoir des paiements de vos clients
                                        directement sur votre
                                        compte bancaire.
                                    </p>
                                    <UButton :loading="stripeLoading" icon="i-bi-stripe"
                                        class="bg-[#635bff] hover:bg-[#5851e6] text-white border-[#635bff] hover:border-[#5851e6] focus:ring-[#635bff]"
                                        @click="createStripeAccount">
                                        {{ stripeError?.includes('plus accessible') ?
                                            'Créer un nouveau compte' :
                                            'Connecter Stripe' }}
                                    </UButton>
                                </div>

                                <div v-else class="space-y-3">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm font-medium">Compte Stripe connecté</p>
                                            <div class="flex items-center gap-2 mt-1">
                                                <UBadge :color="accountStatusColor" variant="subtle">
                                                    {{ accountStatusText }}
                                                </UBadge>
                                                <UBadge v-if="canReceivePayments" color="success" variant="subtle">
                                                    Paiements activés
                                                </UBadge>
                                            </div>
                                        </div>
                                        <UButton color="primary" variant="outline" size="sm" :loading="stripeLoading"
                                            @click="getDashboardLink">
                                            Tableau de bord
                                        </UButton>
                                    </div>

                                    <UAlert v-if="!isAccountComplete" title="Compte incomplet"
                                        description="Votre compte Stripe nécessite des informations supplémentaires pour recevoir des paiements."
                                        color="warning" variant="subtle" :actions="[
                                            {
                                                label: 'Compléter maintenant',
                                                color: 'primary',
                                                variant: 'solid',
                                                onClick: createStripeAccount
                                            }
                                        ]" />
                                </div>
                            </div>
                        </div>
                    </UCard>
                </div>


            </template>
        </UTabs>
    </div>
</template>