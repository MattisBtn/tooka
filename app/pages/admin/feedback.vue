<script setup lang="ts">
import { useUserStore } from '~/stores/user';

const userStore = useUserStore()

// Wait for user data to be loaded before checking admin access
await userStore.fetchUser({ silent: true })

// Check admin access
if (!userStore.isAdmin) {
    throw createError({
        statusCode: 403,
        statusMessage: "Accès refusé",
    })
}
</script>

<template>
    <div class="container mx-auto p-4">
        <SharedPageHeader badge="Admin" badge-color="warning" badge-variant="soft"
            badge-icon="i-heroicons-chat-bubble-left-right" title="Gestion des feedbacks"
            subtitle="Consultez, analysez et gérez les retours et suggestions des utilisateurs" separator />

        <!-- Main Content -->
        <div class="mt-6">
            <FeedbackList />
        </div>
    </div>
</template>
