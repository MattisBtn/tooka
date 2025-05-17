<script setup lang="ts">

useHead({
    title: 'Dashboard - Flow'
})

const { user, logout } = useAuth()

const handleLogout = async () => {
    await logout()
    navigateTo('/login')
}
</script>

<template>
    <div class="container mx-auto p-6">
        <UCard>
            <template #header>
                <div class="flex items-center justify-between">
                    <h1 class="text-xl font-semibold">Dashboard</h1>
                    <UButton color="primary" variant="ghost" @click="handleLogout">
                        Logout
                    </UButton>
                </div>
            </template>

            <div class="py-4">
                <p class="text-gray-600 dark:text-gray-400">
                    Welcome back, {{ user?.email }}!
                </p>
                <p class="mt-4">
                    This is your protected dashboard page. The content here is only visible to authenticated users.
                </p>
            </div>
        </UCard>
    </div>
</template>