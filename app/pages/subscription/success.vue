<template>
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-md mx-auto text-center">
            <div class="mb-6">
                <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-green-500 mx-auto" />
            </div>

            <h1 class="text-2xl font-bold mb-4">Abonnement activé !</h1>
            <p class="text-neutral-600 dark:text-neutral-400 mb-8">
                Votre abonnement a été activé avec succès.
            </p>

            <UButton to="/" color="primary" class="w-full">
                Accéder au dashboard
            </UButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAuth } from "~/composables/auth/useAuth";

useHead({
    title: 'Abonnement activé - Tooka'
});

definePageMeta({
    layout: 'auth'
});

onMounted(async () => {
    const subscriptionStore = useSubscriptionStore();
    const { user } = useAuth();
    if (user.value?.id) {
        await subscriptionStore.fetchCurrentSubscription(user.value.id);
    }
});
</script>