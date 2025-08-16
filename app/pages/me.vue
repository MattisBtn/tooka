<script setup lang="ts">
import type { FormSubmitEvent, TabsItem } from '@nuxt/ui'

import ProfileBillingTab from '~/components/profile/ProfileBillingTab.vue'
import ProfileSecurityTab from '~/components/profile/ProfileSecurityTab.vue'
import { useAuth } from '~/composables/auth/useAuth'
import { useStripeConnect } from '~/composables/user/useStripeConnect'
import { userProfileService } from '~/services/userProfileService'
import { useSubscriptionStore } from '~/stores/subscription'
import { useUserStore } from '~/stores/user'
import type { SubscriptionPlan } from '~/types/subscription'
import type { UserProfile, UserProfileFormData, UserProfileWithAuth } from '~/types/userProfile'
import { userProfileFormSchema } from '~/types/userProfile'

const { user } = useAuth()
const userStore = useUserStore()

// Local form and UI state
const profile = computed<UserProfileWithAuth | null>(() => userStore.user.profile)
const isLoading = computed(() => userStore.isLoading)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const schema = userProfileFormSchema

const formState = ref<UserProfileFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    avatar_url: null,
    company_name: null,
    company_address: null,
    company_city: null,
    company_country: null,
    company_postal_code: null,
    company_siret: null,
    company_tax_id: null,
    bank_account_holder: null,
    bank_name: null,
    bank_iban: null,
    bank_bic: null,
})

const initializeFormState = (p?: UserProfile | null) => {
    if (p) {
        formState.value = {
            first_name: p.first_name || '',
            last_name: p.last_name || '',
            phone: p.phone || '',
            avatar_url: p.avatar_url,
            company_name: p.company_name,
            company_address: p.company_address,
            company_city: p.company_city,
            company_country: p.company_country,
            company_postal_code: p.company_postal_code,
            company_siret: p.company_siret,
            company_tax_id: p.company_tax_id,
            bank_account_holder: p.bank_account_holder,
            bank_name: p.bank_name,
            bank_iban: p.bank_iban,
            bank_bic: p.bank_bic,
        }
    } else {
        const defaults = userProfileService.getDefaultProfileData()
        formState.value = { ...formState.value, ...defaults }
    }
}

watch(() => userStore.user.profile, (p) => initializeFormState(p), { immediate: true })

const isProfileComplete = computed(() => {
    if (!profile.value) return false
    return userProfileService.validateProfileCompleteness(profile.value).isComplete
})

const completionPercentage = computed(() => {
    if (!profile.value) return 0
    return userProfileService.validateProfileCompleteness(profile.value).completionPercentage
})

const hasChanges = computed(() => {
    if (!profile.value) return true
    return Object.keys(formState.value).some((key) => {
        const formValue = formState.value[key as keyof UserProfileFormData]
        const profileValue = profile.value![key as keyof UserProfile]
        const normalizedFormValue = formValue === '' ? null : formValue
        const normalizedProfileValue = profileValue === '' ? null : profileValue
        return normalizedFormValue !== normalizedProfileValue
    })
})

const resetForm = () => {
    initializeFormState(profile.value)
}

const resetError = () => { error.value = null }

const saveProfile = async (data: UserProfileFormData): Promise<UserProfile | null> => {
    if (!user.value?.id) return null
    isSubmitting.value = true
    resetError()
    try {
        const cleanedData = { ...data, phone: data.phone ? data.phone.replace(/\s/g, '') : data.phone }
        const saved = await userStore.updateProfile(cleanedData)
        const toast = useToast()
        toast.add({ title: 'Profil sauvegardé', description: 'Vos informations ont été mises à jour avec succès', color: 'success', icon: 'i-heroicons-check-circle' })
        return saved
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
        const toast = useToast()
        toast.add({ title: 'Erreur de sauvegarde', description: error.value, color: 'error', icon: 'i-heroicons-exclamation-triangle' })
        return null
    } finally {
        isSubmitting.value = false
    }
}

const onSubmit = async (event: FormSubmitEvent<UserProfileFormData>) => {
    return await saveProfile(event.data)
}

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
    getDashboardLink
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
const route = useRoute()
watch(
    () => route.query.tab,
    (tab) => {
        if (typeof tab === 'string' && ['profile', 'security', 'billing'].includes(tab)) {
            activeTab.value = tab
        }
    },
    { immediate: true }
)

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

// Computed for avatar display
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
        <PageHeader badge="Profil" badge-color="info" badge-variant="soft" badge-icon="i-heroicons-user-circle"
            title="Mon Profil" subtitle="Gérez vos informations personnelles et paramètres de compte" separator />

        <!-- Profile Overview Card -->
        <UCard class="mb-8">
            <ClientOnly>
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
            </ClientOnly>
        </UCard>

        <!-- Avatar Upload Modal -->
        <UserAvatarModal v-model="isAvatarModalOpen" />

        <!-- Tabs Navigation -->
        <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #content="{ item }">
                <!-- Profile Tab -->
                <div v-if="item.value === 'profile'">
                    <UserProfileTab v-model:form-state="formState" :profile="profile" :is-submitting="isSubmitting"
                        :error="error" :is-profile-complete="isProfileComplete"
                        :completion-percentage="completionPercentage" :has-changes="hasChanges" :schema="schema"
                        :show-banking-section="false" @submit="handleSubmit" @reset="resetForm"
                        @reset-error="resetError" />
                </div>

                <!-- Security Tab -->
                <div v-else-if="item.value === 'security'">
                    <ProfileSecurityTab :security-settings="securitySettings" />
                </div>

                <!-- Billing Tab -->
                <div v-else-if="item.value === 'billing'">
                    <ProfileBillingTab :is-loading-subscription="isLoadingSubscription"
                        :subscription-error="subscriptionError" :subscription-store="subscriptionStore"
                        :current-plan="currentPlan" :stripe-loading="stripeLoading" :stripe-error="stripeError"
                        :has-stripe-account="hasStripeAccount" :is-account-complete="isAccountComplete"
                        :can-receive-payments="canReceivePayments || false" :account-status-text="accountStatusText"
                        :account-status-color="accountStatusColor" :form-state="formState" :profile="profile"
                        :is-submitting="isSubmitting" :error="error" :has-changes="hasChanges" :schema="schema"
                        @submit="handleSubmit" @reset="resetForm" @reset-error="resetError"
                        @create-stripe-account="createStripeAccount" @get-dashboard-link="getDashboardLink"
                        @handle-portal-access="handlePortalAccess" />
                </div>
            </template>
        </UTabs>
    </div>
</template>