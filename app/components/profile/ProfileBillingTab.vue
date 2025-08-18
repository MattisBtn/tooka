<template>
    <div class="space-y-6">
        <UCard>
            <template #header>
                <div class="flex items-center gap-3">
                    <div
                        class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                        <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-white dark:text-black" />
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Facturation</h3>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">Gérez vos abonnements et paiements</p>
                    </div>
                </div>
            </template>

            <div class="space-y-6">
                <!-- Subscription Information -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-receipt-percent" class="w-4 h-4 text-white dark:text-black" />
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Abonnement</h4>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Votre plan actuel et facturation
                            </p>
                        </div>
                    </div>

                    <div v-if="isLoadingSubscription" class="flex items-center justify-center py-8">
                        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary" />
                        <span class="ml-2 text-neutral-600 dark:text-neutral-400">Chargement de l'abonnement...</span>
                    </div>

                    <div v-else-if="subscriptionError" class="mb-4">
                        <UAlert color="error" variant="subtle" :title="subscriptionError" />
                    </div>

                    <div v-else-if="subscriptionStore.currentSubscription" class="space-y-4">
                        <!-- Current Plan -->
                        <div class="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                            <div>
                                <h5 class="font-medium">Plan actuel</h5>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    {{ currentPlan?.name || 'Plan inconnu' }}
                                </p>
                            </div>
                            <UBadge
                                :color="getSubscriptionStatusColor(subscriptionStore.currentSubscription.subscription_status)"
                                variant="subtle">
                                {{ formatSubscriptionStatus(subscriptionStore.currentSubscription.subscription_status)
                                }}
                            </UBadge>
                        </div>

                        <!-- Subscription Details -->
                        <div v-if="subscriptionStore.currentSubscription.subscription_end_date" class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-neutral-600 dark:text-neutral-400">
                                    {{ subscriptionStore.currentSubscription.subscription_status === 'canceled' ?
                                        'Expire le' : 'Prochaine facturation' }}:
                                </span>
                                <span>{{ formatDate(subscriptionStore.currentSubscription.subscription_end_date)
                                }}</span>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex gap-2">
                            <UButton v-if="subscriptionStore.currentSubscription.stripe_subscription_id" color="primary"
                                variant="outline" size="sm" @click="handlePortalAccess">
                                Gérer l'abonnement
                            </UButton>
                            <UButton v-else-if="!subscriptionStore.hasValidSubscription" color="primary" variant="solid"
                                size="sm" @click="navigateTo('/pricing')">
                                Souscrire
                            </UButton>
                        </div>
                    </div>

                    <div v-else class="text-center py-8">
                        <UIcon name="i-heroicons-credit-card" class="w-12 h-12 text-neutral-400 mx-auto mb-4" />
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
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                            <UIcon name="i-bi-stripe" class="w-4 h-4 text-white dark:text-black" />
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recevoir des
                                paiements avec
                                Stripe</h4>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Connectez votre compte pour
                                recevoir des
                                paiements</p>
                        </div>
                    </div>

                    <div v-if="stripeError" class="mb-4">
                        <UAlert color="error" variant="subtle" :title="stripeError" @close="resetStripeError">
                            <template v-if="stripeError.includes('plus accessible')" #actions>
                                <UButton color="error" variant="ghost" size="xs" @click="createStripeAccount">
                                    Créer un nouveau compte
                                </UButton>
                            </template>
                        </UAlert>
                    </div>

                    <div v-if="!hasStripeAccount" class="space-y-3">
                        <p class="text-sm text-neutral-500">
                            Connectez votre compte Stripe pour recevoir des paiements de vos clients directement sur
                            votre
                            compte bancaire.
                        </p>
                        <UButton :loading="stripeLoading" icon="i-bi-stripe"
                            class="bg-[#635bff] hover:bg-[#5851e6] text-white border-[#635bff] hover:border-[#5851e6] focus:ring-[#635bff]"
                            @click="createStripeAccount">
                            {{ stripeError?.includes('plus accessible') ? 'Créer un nouveau compte' : 'Connecter Stripe'
                            }}
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

                <USeparator />

                <!-- Banking Information Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-banknotes" class="w-4 h-4 text-white dark:text-black" />
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations
                                bancaires</h4>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Vos coordonnées bancaires pour les
                                paiements
                            </p>
                        </div>
                    </div>

                    <UserBankingForm v-model:form-state="localFormState" :profile="profile"
                        :is-submitting="isSubmitting" :error="error" :has-changes="hasChanges" :schema="schema"
                        @submit="handleSubmit" @reset="resetForm" @reset-error="resetError" />
                </div>
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import type { SubscriptionPlan } from '~/types/subscription'
import type { UserProfileFormData, UserProfileWithAuth } from '~/types/userProfile'

interface Props {
    isLoadingSubscription: boolean
    subscriptionError: string | null
    subscriptionStore: {
        currentSubscription: {
            subscription_status: string | null
            subscription_end_date: string | null
            stripe_subscription_id: string | null
        } | null
        hasValidSubscription: boolean
    }
    currentPlan: SubscriptionPlan | null
    stripeLoading: boolean
    stripeError: string | null
    hasStripeAccount: boolean
    isAccountComplete: boolean
    canReceivePayments: boolean
    accountStatusText: string
    accountStatusColor: 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'
    formState: UserProfileFormData
    profile: UserProfileWithAuth | null
    isSubmitting: boolean
    error: string | null
    hasChanges: boolean
    schema: z.ZodType<UserProfileFormData>
}

const _props = defineProps<Props>()

// Computed pour éviter la mutation directe du prop
const localFormState = computed({
    get: () => _props.formState,
    set: (value) => {
        // Émettre un événement pour mettre à jour le formState parent
        emit('update:formState', value)
    }
})

const emit = defineEmits<{
    submit: [event: FormSubmitEvent<UserProfileFormData>]
    reset: []
    resetError: []
    createStripeAccount: []
    getDashboardLink: []
    handlePortalAccess: []
    resetStripeError: []
    'update:formState': [value: UserProfileFormData]
}>()

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

const handleSubmit = (event: FormSubmitEvent<UserProfileFormData>) => {
    emit('submit', event)
}

const resetForm = () => {
    emit('reset')
}

const resetError = () => {
    emit('resetError')
}

const createStripeAccount = () => {
    emit('createStripeAccount')
}

const getDashboardLink = () => {
    emit('getDashboardLink')
}

const handlePortalAccess = () => {
    emit('handlePortalAccess')
}

const resetStripeError = () => {
    emit('resetStripeError')
}
</script>
