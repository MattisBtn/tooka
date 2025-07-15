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

            <!-- Module Configuration -->
            <div class="space-y-4">
                <div class="flex items-center gap-3 mb-6">
                    <div
                        class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <UIcon name="i-lucide-puzzle" class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Configuration des
                            modules
                        </h2>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">Activez et configurez les
                            fonctionnalités de
                            votre projet</p>
                    </div>
                </div>

                <!-- Proposal Module (now autonomous) -->
                <ProjectProposalModule :project-id="projectId"
                    :project-initial-price="project?.initial_price || undefined" />

                <!-- Moodboard Module (now autonomous) -->
                <ProjectMoodboardModule :project-id="projectId" />

                <!-- Selection Module (now autonomous) -->
                <ProjectSelectionModule :project-id="projectId" />

                <!-- Gallery Module (now autonomous) -->
                <ProjectGalleryModule :project-id="projectId" />
            </div>

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







// Upload state for UI feedback  

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













// Initialize - Simplified initialization logic
onMounted(async () => {
    try {
        await fetchProject()
        // Other modules initialize when enabled via watchers
    } catch (err) {
        console.error('Error loading project:', err)
    }
})

// Module watchers - initialize modules when enabled





</script>

<style scoped>
/* Add any custom styles here */
</style>