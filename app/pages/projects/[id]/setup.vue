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
                :formatted-created-at="formattedCreatedAt" :formatted-expires-at="formattedExpiresAt" />

            <!-- Module Configuration -->
            <div class="space-y-4">
                <div class="flex items-center gap-3 mb-6">
                    <div
                        class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <UIcon name="i-lucide-puzzle" class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Configuration des modules
                        </h2>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Activez et configurez les fonctionnalités de
                            votre projet</p>
                    </div>
                </div>

                <!-- Proposal Module -->
                <ProposalModule v-model:enabled="modules.proposal.enabled" :proposal-data="proposalData"
                    :proposal-status-info="proposalStatusInfo || null" :formatted-price="formattedProposalPrice"
                    :formatted-deposit-amount="formattedProposalDeposit" :project-id="projectId"
                    :project-initial-price="project?.initial_price || undefined"
                    @proposal-saved="handleProposalSaved" />

                <!-- Moodboard Module -->
                <ModuleCard v-model:enabled="modules.moodboard.enabled" title="Moodboard"
                    description="Planche d'inspiration pour le client" icon="i-lucide-image" icon-color="text-pink-500"
                    :completed="modules.moodboard.completed" :summary="modules.moodboard.summary"
                    @update:enabled="(value: boolean) => toggleModule('moodboard', value)" />

                <!-- Selection Module -->
                <ModuleCard v-model:enabled="modules.selection.enabled" title="Pré-sélection"
                    description="Sélection d'images par le client" icon="i-lucide-mouse-pointer-click"
                    icon-color="text-blue-500" :completed="modules.selection.completed"
                    :summary="modules.selection.summary"
                    @update:enabled="(value: boolean) => toggleModule('selection', value)" />

                <!-- Gallery Module -->
                <ModuleCard v-model:enabled="modules.gallery.enabled" title="Galerie"
                    description="Galerie finale pour le client" icon="i-lucide-images" icon-color="text-violet-500"
                    :completed="modules.gallery.completed" :summary="modules.gallery.summary"
                    @update:enabled="(value: boolean) => toggleModule('gallery', value)" />
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" label="Retour aux projets"
                    @click="navigateTo('/projects')" />

                <div class="flex items-center gap-3">
                    <UButton icon="i-lucide-eye" variant="outline" color="primary" label="Aperçu client" disabled />
                    <UButton icon="i-lucide-save" color="primary" label="Sauvegarder" disabled />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { BreadcrumbItem } from '@nuxt/ui'
import { useProject } from '~/composables/projects/useProject'
import { useProposal } from '~/composables/proposals/useProposal'
import type { Proposal, ProposalFormData } from '~/types/proposal'

// Import components
import ModuleCard from '~/components/project/ModuleCard.vue'
import ProjectSummary from '~/components/project/ProjectSummary.vue'
import ProposalModule from '~/components/project/ProposalModule.vue'

// Get project ID from route
const route = useRoute()
const projectId = route.params.id as string

// Use project composable
const {
    loading,
    error,
    project,
    modules,
    clientDisplayName,
    statusInfo,
    formattedPrice,
    formattedCreatedAt,
    formattedExpiresAt,
    fetchProject,
    toggleModule,
    updateModuleState,
} = useProject(projectId)

// Use proposal composable
const {
    proposal: proposalData,
    formattedPrice: formattedProposalPrice,
    formattedDepositAmount: formattedProposalDeposit,
    fetchProposal,
    saveProposal,
    getStatusOptions: getProposalStatusOptions,
} = useProposal(projectId)

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

// Proposal status info
const proposalStatusInfo = computed(() => {
    if (!proposalData.value) return null
    const statusOptions = getProposalStatusOptions()
    return statusOptions.find((s) => s.value === proposalData.value!.status)
})

// Handle proposal saved
const handleProposalSaved = async (data: { proposal: Proposal; projectUpdated: boolean }) => {
    try {
        // Save the proposal using the composable
        await saveProposal(data.proposal as ProposalFormData, data.projectUpdated)

        // Update module state
        updateModuleState('proposal', {
            completed: true,
            summary: `Proposition "${data.proposal.title}" créée`
        })

        // Show success notification
        const toast = useToast()
        if (data.projectUpdated) {
            toast.add({
                title: 'Proposition validée !',
                description: 'La proposition a été envoyée au client et le projet est maintenant en cours.',
                icon: 'i-lucide-check-circle',
                color: 'success'
            })
        } else {
            toast.add({
                title: 'Brouillon sauvegardé',
                description: 'Votre proposition a été sauvegardée en brouillon.',
                icon: 'i-lucide-save',
                color: 'info'
            })
        }

        // Refresh project data if needed
        if (data.projectUpdated) {
            await fetchProject()
        }

        // Refresh proposal data
        await fetchProposal()
    } catch (err) {
        console.error('Error saving proposal:', err)
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors de la sauvegarde.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

// Initialize
onMounted(async () => {
    try {
        await fetchProject()
        // Sync proposal data from project if it exists
        if (project.value?.proposal && !proposalData.value) {
            await fetchProposal()
        }
    } catch (err) {
        console.error('Error loading project:', err)
    }
})

// Watch for proposal module changes and project changes
watch(() => modules.value.proposal.enabled, async (enabled) => {
    if (enabled && !proposalData.value) {
        await fetchProposal()
    }
})

// Watch for project changes to sync proposal data
watch(() => project.value?.proposal, async (newProposal) => {
    if (newProposal && !proposalData.value) {
        await fetchProposal()
    }
}, { immediate: true })
</script>

<style scoped>
/* Add any custom styles here */
</style>