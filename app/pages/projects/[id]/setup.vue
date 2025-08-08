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
                :formatted-created-at="store.formattedCreatedAt" :can-edit-project="store.canEditProject" />

            <!-- Payment setup gate -->
            <div v-if="!userStore.hasPaymentSetup" class="space-y-6">
                <UAlert color="warning" variant="subtle" icon="i-heroicons-exclamation-triangle"
                    title="Configuration de paiement requise"
                    description="Vous devez configurer un moyen de paiement (coordonnées bancaires ou Stripe Connect) avant de pouvoir configurer les modules du projet." />

                <div>
                    <UButton color="primary" icon="i-heroicons-credit-card" @click="navigateTo('/me?tab=billing')">
                        Configurer mes paiements
                    </UButton>
                </div>
            </div>

            <!-- Project Stepper & Modules when payment is configured -->
            <template v-else>
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
                <ProjectMoodboardSection v-if="currentStep === 2" />

                <!-- Selection Section -->
                <ProjectSelectionSection v-if="currentStep === 3" />

                <!-- Gallery Section -->
                <ProjectGallerySection v-if="currentStep === 4" />
            </template>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { BreadcrumbItem } from '@nuxt/ui'
import { useUserStore } from '~/stores/user'
import type { WorkflowStep } from '~/types/project'

// Get project ID from route
const route = useRoute()
const projectId = route.params.id as string

// Use project setup store
const store = useProjectSetupStore()
const userStore = useUserStore()

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

// Example of how to use the automatic status update
// This would be called after any module status changes
// const handleModuleStatusChange = async () => {
//     try {
//         await store.checkAndUpdateProjectStatus()
//     } catch (error) {
//         console.error('Error updating project status:', error)
//     }
// }


// Initialize
onMounted(async () => {
    try {
        // Ensure user data is up to date to evaluate payment setup
        await userStore.fetchUser({ silent: true })
        await store.fetchProject(projectId)
    } catch (err) {
        console.error('Error loading project:', err)
    }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>