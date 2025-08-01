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

            <!-- Project Stepper -->
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100">Configuration des modules
                    </h3>
                </div>

                <ProjectSetupStepper :current-step="currentStep" @step-changed="handleStepChange" />
            </div>

            <!-- Proposal Section -->
            <ProjectProposalSection v-if="currentStep === 1" />

            <!-- Moodboard Section -->
            <div v-else-if="currentStep === 2" class="space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100">Moodboard</h3>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Planche d'inspiration visuelle pour le client avec collaboration en temps réel
                        </p>
                    </div>
                </div>

                <div
                    class="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                    <div class="py-8 text-center">
                        <div
                            class="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UIcon name="i-lucide-image" class="w-8 h-8 text-pink-600 dark:text-pink-400" />
                        </div>
                        <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Module Moodboard</h4>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                            Section en cours de développement
                        </p>
                    </div>
                </div>
            </div>

            <!-- Selection Section -->
            <div v-else-if="currentStep === 3" class="space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100">Sélection</h3>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Permettez au client de choisir parmi vos propositions
                        </p>
                    </div>
                </div>

                <div
                    class="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                    <div class="py-8 text-center">
                        <div
                            class="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UIcon name="i-lucide-check-square" class="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Module Sélection</h4>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                            Section en cours de développement
                        </p>
                    </div>
                </div>
            </div>

            <!-- Gallery Section -->
            <div v-else-if="currentStep === 4" class="space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100">Galerie</h3>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Livrable final pour le client
                        </p>
                    </div>
                </div>

                <div
                    class="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                    <div class="py-8 text-center">
                        <div
                            class="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UIcon name="i-lucide-gallery" class="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Module Galerie</h4>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                            Section en cours de développement
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { BreadcrumbItem } from '@nuxt/ui'
import type { WorkflowStep } from '~/types/project'

// Get project ID from route
const route = useRoute()
const projectId = route.params.id as string

// Use project setup store
const store = useProjectSetupStore()

// Current step state
const currentStep = ref<WorkflowStep>(1)



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

// Methods
const handleStepChange = (stepNumber: number) => {
    currentStep.value = stepNumber as WorkflowStep
}



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