<template>
    <div class="w-full max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold mb-4">Choisissez votre plan</h1>
            <p class="text-xl text-neutral-600 dark:text-neutral-400">
                Commencez gratuitement, évoluez selon vos besoins
            </p>
        </div>

        <!-- Intervalle de facturation -->
        <div class="flex justify-center mb-8">
            <div class="flex items-center gap-4">
                <span class="text-sm font-medium" :class="{ 'text-primary': selectedInterval === 'monthly' }">
                    Mensuel
                </span>
                <USwitch v-model="isYearly" color="primary" size="lg" />
                <span class="text-sm font-medium" :class="{ 'text-primary': selectedInterval === 'yearly' }">
                    Annuel
                </span>
            </div>
        </div>

        <!-- Grille des plans -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UCard v-for="plan in plans" :key="plan.id" class="relative transition-all duration-200 hover:shadow-lg"
                :class="{ 'ring-2 ring-primary-500 shadow-lg': isCurrentPlan(plan) }">
                <template #header>
                    <div class="text-center">
                        <h3 class="text-xl font-semibold">{{ plan.name }}</h3>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            {{ plan.description }}
                        </p>
                    </div>
                </template>

                <div class="text-center mb-6">
                    <div class="text-3xl font-bold">
                        {{ formatPrice(selectedPrice(plan)) }}
                        <span class="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                            /{{ selectedInterval === 'monthly' ? 'mois' : 'an' }}
                        </span>
                    </div>
                    <UBadge v-if="selectedInterval === 'yearly'" color="success" variant="subtle" class="mt-2">
                        Économisez {{ calculateSavings(plan) }}%
                    </UBadge>
                </div>

                <div class="space-y-3 mb-6">
                    <div v-for="feature in plan.features" :key="feature" class="flex items-center">
                        <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500 mr-2" />
                        <span class="text-sm">{{ feature }}</span>
                    </div>
                </div>

                <UButton :loading="loading" :disabled="loading || isCurrentPlan(plan)"
                    :color="isCurrentPlan(plan) ? 'neutral' : 'primary'"
                    :variant="isCurrentPlan(plan) ? 'soft' : 'solid'" class="w-full" @click="handleSubscribe(plan)">
                    {{ getButtonText(plan) }}
                </UButton>
            </UCard>
        </div>

        <!-- Informations supplémentaires -->
        <div class="mt-12 text-center">
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Tous les plans incluent un essai gratuit de 14 jours.
                Annulez à tout moment.
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAuth } from "~/composables/auth/useAuth";
import type { SubscriptionPlan } from "~/types/subscription";

useHead({
    title: 'Pricing - Tooka'
});

definePageMeta({
    layout: 'auth'
})

const store = useSubscriptionStore();
const { user } = useAuth();

// State local - utiliser un boolean pour USwitch
const isYearly = ref(false);

// Computed pour l'intervalle sélectionné
const selectedInterval = computed(() => isYearly.value ? 'yearly' : 'monthly');

// Computed
const plans = computed(() => store.plans);
const currentSubscription = computed(() => store.currentSubscription);
const loading = computed(() => store.loading);

const selectedPrice = (plan: SubscriptionPlan) => {
    return selectedInterval.value === "monthly"
        ? plan.price_monthly
        : plan.price_yearly;
};

const isCurrentPlan = (plan: SubscriptionPlan) => {
    return currentSubscription.value?.subscription_status === "active" && plan.name === "Pro";
};

const getButtonText = (plan: SubscriptionPlan) => {
    if (isCurrentPlan(plan)) return "Plan actuel";
    return `Choisir ${plan.name}`;
};

const calculateSavings = (plan: SubscriptionPlan) => {
    const yearlyPrice = plan.price_yearly;
    const monthlyPrice = plan.price_monthly * 12;
    return Math.round(((monthlyPrice - yearlyPrice) / monthlyPrice) * 100);
};

const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (isCurrentPlan(plan)) return;

    const priceId =
        selectedInterval.value === "monthly"
            ? plan.stripe_price_id_monthly
            : plan.stripe_price_id_yearly;

    if (!priceId) {
        console.error('Price ID not found for plan:', plan.name);
        return;
    }

    if (!user.value?.id) {
        console.error('User not authenticated');
        return;
    }

    try {
        await store.createSubscription(user.value.id, priceId, selectedInterval.value);
    } catch (error) {
        console.error('Failed to create subscription:', error);
    }
};

// Charger les plans au montage
onMounted(async () => {
    try {
        await store.fetchPlans();
    } catch (error) {
        console.error('Failed to fetch plans:', error);
    }
});
</script>