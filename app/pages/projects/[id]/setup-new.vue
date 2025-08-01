<template>
    <div class="container mx-auto p-4 max-w-4xl">
        <!-- Breadcrumb -->
        <UBreadcrumb :items="breadcrumbItems" class="mb-6" />

        <!-- Loading State -->
        <div v-if="store.isLoading" class="flex items-center justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
        </div>

        <!-- Error State -->
        <div v-else-if="store.hasError" class="text-center py-12">
            <UAlert color="error" variant="soft" icon="i-lucide-alert-circle" title="Erreur"
                :description="store.error?.message" />
        </div>

        <!-- Main Content -->
        <div v-else-if="store.project" class="space-y-8">
            <!-- Page Header -->
            <PageHeader badge="Configuration" badge-color="primary" badge-variant="soft" badge-icon="i-lucide-settings"
                :title="store.project.title" subtitle="Configurez les modules et fonctionnalités de votre projet"
                separator />

            <!-- Project Summary -->
            <ProjectSummary :project="store.project" :client-display-name="store.clientDisplayName"
                :status-info="store.statusInfo || null" :formatted-price="store.formattedPrice"
                :formatted-created-at="store.formattedCreatedAt" />

            <!-- Proposal Section -->
            <ProjectProposalSection />
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { BreadcrumbItem } from '@nuxt/ui'

// Get project ID from route
const route = useRoute()
const projectId = route.params.id as string

// Use project setup store
const store = useProjectSetupStore()

// Breadcrumb items
const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    {
        label: 'Projets',
        icon: 'i-lucide-folder',
        to: '/projects'
    },
    {
        label: store.project?.title || 'Configuration du projet',
        icon: 'i-lucide-settings'
    }
])

// Meta tags
useHead({
    title: computed(() => store.project ? `Configuration - ${store.project.title}` : 'Configuration du projet'),
})

// Initialize
onMounted(async () => {
    try {
        await store.fetchProject(projectId)
    } catch (err) {
        console.error('Error loading project:', err)
    }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>