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
                <GalleryModule v-model:enabled="modules.gallery.enabled" :gallery-data="galleryData"
                    :gallery-status-info="galleryStatusInfo || null" :pricing="galleryPricing || null"
                    :formatted-base-price="formattedGalleryBasePrice"
                    :formatted-deposit-paid="formattedGalleryDepositPaid"
                    :formatted-remaining-amount="formattedGalleryRemainingAmount" :image-count="imageCount"
                    :has-images="hasImages" :project-id="projectId" :is-uploading="isUploadingImages"
                    :upload-progress="uploadProgress" @gallery-saved="handleGallerySaved" />
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" label="Retour aux projets"
                    @click="navigateTo('/projects')" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { BreadcrumbItem } from '@nuxt/ui'
import { useGallery } from '~/composables/galleries/user/useGallery'
import { useProject } from '~/composables/projects/useProject'
import { useProposal } from '~/composables/proposals/useProposal'
import type { Gallery, GalleryFormData } from '~/types/gallery'
import type { Proposal, ProposalFormData } from '~/types/proposal'

// Import components
import GalleryModule from '~/components/project/GalleryModule.vue'
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

// Use gallery composable
const {
    gallery: galleryData,
    pricing: galleryPricing,
    imageCount,
    hasImages,
    formattedBasePrice: formattedGalleryBasePrice,
    formattedDepositPaid: formattedGalleryDepositPaid,
    formattedRemainingAmount: formattedGalleryRemainingAmount,
    fetchGallery,
    saveGallery,
    getStatusOptions: getGalleryStatusOptions,
    uploadImages,
} = useGallery(projectId)

// Upload state for UI feedback
const isUploadingImages = ref(false)
const uploadProgress = ref(0)

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

// Gallery status info
const galleryStatusInfo = computed(() => {
    if (!galleryData.value) return null
    const statusOptions = getGalleryStatusOptions()
    return statusOptions.find((s) => s.value === galleryData.value!.status)
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

// Handle gallery saved
const handleGallerySaved = async (data: { gallery: Gallery; projectUpdated: boolean; selectedFiles?: File[] }) => {
    try {
        // Save the gallery using the composable
        const result = await saveGallery(data.gallery as GalleryFormData, data.projectUpdated)

        // Handle file uploads if there are selected files
        if (data.selectedFiles && data.selectedFiles.length > 0) {
            // Get the gallery ID from the result or existing gallery data
            const galleryId = result.gallery.id || galleryData.value?.id

            if (galleryId) {
                isUploadingImages.value = true
                uploadProgress.value = 0

                try {
                    // Simulate progress for better UX
                    const progressInterval = setInterval(() => {
                        if (uploadProgress.value < 85) {
                            uploadProgress.value += Math.random() * 15
                        }
                    }, 300)

                    // Upload images using the gallery composable
                    await uploadImages(data.selectedFiles)

                    clearInterval(progressInterval)
                    uploadProgress.value = 100

                    // Small delay to show 100% before hiding
                    setTimeout(() => {
                        isUploadingImages.value = false
                        uploadProgress.value = 0
                    }, 1000)

                } catch (uploadErr) {
                    console.error('Error uploading images:', uploadErr)
                    isUploadingImages.value = false
                    uploadProgress.value = 0

                    const toast = useToast()
                    toast.add({
                        title: 'Erreur d\'upload',
                        description: uploadErr instanceof Error ? uploadErr.message : 'Une erreur est survenue lors de l\'upload des images.',
                        icon: 'i-lucide-alert-circle',
                        color: 'error'
                    })
                }
            }
        }

        // Update module state
        updateModuleState('gallery', {
            completed: true,
            summary: `Galerie avec ${imageCount.value} image${imageCount.value > 1 ? 's' : ''}`
        })

        // Show success notification for gallery save
        const toast = useToast()
        if (data.projectUpdated) {
            toast.add({
                title: 'Galerie validée !',
                description: 'La galerie a été envoyée au client.',
                icon: 'i-lucide-check-circle',
                color: 'success'
            })
        } else {
            toast.add({
                title: 'Brouillon sauvegardé',
                description: 'Votre galerie a été sauvegardée en brouillon.',
                icon: 'i-lucide-save',
                color: 'info'
            })
        }

        // Refresh project data if needed
        if (data.projectUpdated) {
            await fetchProject()
        }

        // Refresh gallery data
        await fetchGallery()
    } catch (err) {
        console.error('Error saving gallery:', err)
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

// Watch for gallery module changes
watch(() => modules.value.gallery.enabled, async (enabled) => {
    if (enabled && !galleryData.value) {
        await fetchGallery()
    }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>