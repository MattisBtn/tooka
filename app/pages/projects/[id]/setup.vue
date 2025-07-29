<template>
    <div class="container mx-auto p-4 max-w-4xl">
        <!-- Breadcrumb -->
        <UBreadcrumb :items="breadcrumbItems" class="mb-6" />

        <!-- Loading State -->
        <div v-if="projectStore.loading" class="flex items-center justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
        </div>

        <!-- Error State -->
        <div v-else-if="projectStore.error" class="text-center py-12">
            <UAlert color="error" variant="soft" icon="i-lucide-alert-circle" title="Erreur"
                :description="projectStore.error.message" />
        </div>

        <!-- Main Content -->
        <div v-else-if="projectStore.project" class="space-y-8">
            <!-- Page Header -->
            <PageHeader badge="Configuration" badge-color="primary" badge-variant="soft" badge-icon="i-lucide-settings"
                :title="projectStore.project.title" subtitle="Configurez les modules et fonctionnalités de votre projet"
                separator />

            <!-- Project Summary -->
            <ProjectSummary :project="projectStore.project" :client-display-name="projectStore.clientDisplayName"
                :status-info="projectStore.statusInfo || null" :formatted-price="projectStore.formattedPrice"
                :formatted-created-at="projectStore.formattedCreatedAt" />

            <!-- Module Onboarding -->
            <ProjectModuleOnboarding :project-id="projectId"
                :project-initial-price="projectStore.project?.initial_price || undefined" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { BreadcrumbItem } from '@nuxt/ui'
import { useProjectStore } from '~/stores/project'

// Get project ID from route
const route = useRoute()
const projectId = route.params.id as string

// Use project store
const projectStore = useProjectStore()

// Breadcrumb items
const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    {
        label: 'Projets',
        icon: 'i-lucide-folder',
        to: '/projects'
    },
    {
        label: projectStore.project?.title || 'Configuration du projet',
        icon: 'i-lucide-settings'
    }
])

// Meta tags
useHead({
    title: computed(() => projectStore.project ? `Configuration - ${projectStore.project.title}` : 'Configuration du projet'),
})

// Initialize
onMounted(async () => {
    try {
        await projectStore.fetchProject(projectId)
    } catch (err) {
        console.error('Error loading project:', err)
    }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>