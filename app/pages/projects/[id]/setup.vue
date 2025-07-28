<template>
    <div class="container mx-auto p-4 max-w-4xl">
        <!-- Breadcrumb -->
        <UBreadcrumb :items="breadcrumbItems" class="mb-6" />

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12">
            <UAlert color="error" variant="soft" icon="i-lucide-alert-circle" title="Erreur"
                :description="error.message" />
        </div>

        <!-- Main Content -->
        <div v-else-if="project" class="space-y-8">
            <!-- Page Header -->
            <PageHeader badge="Configuration" badge-color="primary" badge-variant="soft" badge-icon="i-lucide-settings"
                :title="project.title" subtitle="Configurez les modules et fonctionnalités de votre projet" separator />

            <!-- Project Summary -->
            <ProjectSummary :project="project" :client-display-name="clientDisplayName"
                :status-info="statusInfo || null" :formatted-price="formattedPrice"
                :formatted-created-at="formattedCreatedAt" />

            <!-- Module Onboarding -->
            <ProjectModuleOnboarding :project-id="projectId"
                :project-initial-price="project?.initial_price || undefined"
                :existing-proposal="project?.proposal || null" @proposal-created="handleProposalCreated" />

            <!-- Action Buttons -->
            <div class="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" label="Retour aux projets"
                    @click="navigateTo('/projects')" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { BreadcrumbItem } from '@nuxt/ui'
import { useProject } from '~/composables/projects/useProject'

// Get project ID from route
const route = useRoute()
const projectId = route.params.id as string

// Use project composable
const {
    loading,
    error,
    project,
    clientDisplayName,
    statusInfo,
    formattedPrice,
    formattedCreatedAt,
    fetchProject,
} = useProject(projectId)

// Breadcrumb items
const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    {
        label: 'Projets',
        icon: 'i-lucide-folder',
        to: '/projects'
    },
    {
        label: project.value?.title || 'Configuration du projet',
        icon: 'i-lucide-settings'
    }
])

// Meta tags
useHead({
    title: computed(() => project.value ? `Configuration - ${project.value.title}` : 'Configuration du projet'),
})

// Handle proposal creation event
const handleProposalCreated = async () => {
    try {
        // Recharger les données du projet pour obtenir la proposition créée
        await fetchProject()
    } catch (err) {
        console.error('Error reloading project:', err)
    }
}

// Initialize
onMounted(async () => {
    try {
        await fetchProject()
    } catch (err) {
        console.error('Error loading project:', err)
    }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>