<template>
    <ClientOnly>
        <div class="min-h-screen bg-white dark:bg-neutral-900">
            <!-- Headers avec conditions mutuellement exclusives -->
            <!-- Moodboard Header - affiché seulement quand tout est chargé et authentifié -->
            <MoodboardHeader v-if="moodboard && isAuthenticated && project" :project="project" :moodboard="moodboard"
                :is-authenticated="isAuthenticated" :show-logout-button="project?.hasPassword && isAuthenticated"
                @validate="handleValidate" @request-revisions="handleRequestRevisions" @logout="handleLogout" />

            <!-- Simple header pour tous les autres états -->
            <MoodboardSimpleHeader v-else />

            <!-- Content avec padding approprié -->
            <div :class="{ 'pt-16': moodboard && isAuthenticated && project }">
                <!-- Password form if needed -->
                <MoodboardPasswordForm v-if="needsPassword && !isAuthenticated" :project="project"
                    :moodboard-id="moodboardId" :error="authError" @authenticated="handleAuthentication" />

                <!-- Moodboard view -->
                <MoodboardClientView v-else-if="moodboard && isAuthenticated && project" :moodboard-id="moodboardId"
                    :moodboard="moodboard" :project="project" :images="mutableImages" :has-more="hasMore"
                    :loading-more="loadingMore" :can-interact="canInteract" :uploading-images="uploadingImages"
                    :upload-progress="uploadProgress" @load-more="loadMore" @upload-images="handleUploadImages"
                    @add-comment="handleAddComment" @react-to-image="handleReactToImage" />

                <!-- Loading state -->
                <div v-else-if="loading" class="min-h-screen flex items-center justify-center">
                    <div class="text-center">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-pink-600 animate-spin mx-auto mb-4" />
                        <p class="text-neutral-600 dark:text-neutral-400">Chargement du moodboard...</p>
                    </div>
                </div>

                <!-- Error state -->
                <div v-else class="min-h-screen flex items-center justify-center p-4">
                    <UCard class="w-full max-w-lg text-center">
                        <div class="space-y-6">
                            <div
                                class="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <UIcon name="i-heroicons-exclamation-triangle"
                                    class="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                                    Moodboard non trouvé
                                </h1>
                                <p class="text-neutral-600 dark:text-neutral-400 mb-4">
                                    Ce moodboard n'existe pas ou n'est plus accessible.
                                </p>
                                <p class="text-sm text-neutral-500 dark:text-neutral-500">
                                    Vérifiez le lien fourni ou contactez votre photographe.
                                </p>
                            </div>
                        </div>
                    </UCard>
                </div>
            </div>

            <!-- Action Modals -->
            <MoodboardActionModals v-model:show-validate-dialog="showValidateDialog"
                v-model:show-request-revisions-dialog="showRequestRevisionsDialog"
                v-model:revision-comment="revisionComment" :validating-moodboard="validatingMoodboard"
                :requesting-revisions="requestingRevisions" @validate="validateMoodboard"
                @request-revisions="requestRevisions" />

            <!-- Footer -->
            <footer class="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 py-8">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center">
                        <p class="text-sm text-neutral-500 dark:text-neutral-400">
                            Powered by
                            <span class="font-medium text-pink-600 dark:text-pink-400">Tooka</span>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    </ClientOnly>
</template>

<script setup lang="ts">
import { useClientMoodboard } from '~/composables/moodboards/client/useClientMoodboard'

definePageMeta({
    layout: false,
})

// Get moodboard ID from route
const route = useRoute()
const moodboardId = route.params.id as string

// Use client moodboard composable with all functionality
const {
    // Core data
    project,
    moodboard,
    images,
    loading,
    loadingMore,
    error,
    needsPassword,
    isAuthenticated,
    authError,
    hasMore,
    canInteract,

    // Action states
    validatingMoodboard,
    requestingRevisions,
    uploadingImages,
    uploadProgress,

    // Modal states
    showValidateDialog,
    showRequestRevisionsDialog,

    // Form state
    revisionComment,

    // Core actions
    verifyPassword,
    loadMore,

    // Client actions
    validateMoodboard,
    requestRevisions,
    uploadImages,
    addComment,
    reactToImage,

    // Auth methods
    logout,
} = await useClientMoodboard(moodboardId)

// Handle password authentication
const handleAuthentication = async (password: string) => {
    await verifyPassword(password)
}

// Handle logout
const handleLogout = () => {
    logout()
}

// Handle validate action from header
const handleValidate = () => {
    showValidateDialog.value = true
}

// Handle request revisions action from header
const handleRequestRevisions = () => {
    showRequestRevisionsDialog.value = true
}

// Handle image upload
const handleUploadImages = async (files: File[]) => {
    await uploadImages(files)
}

// Handle add comment
const handleAddComment = async (imageId: string, comment: string) => {
    await addComment(imageId, comment)
}

// Handle image reaction
const handleReactToImage = async (imageId: string, reaction: 'love' | 'like' | 'dislike') => {
    await reactToImage(imageId, reaction)
}

// Convert readonly images to mutable for component props
const mutableImages = computed(() => {
    return images.value.map(image => ({
        ...image,
        comments: image.comments ? Array.from(image.comments) : []
    }))
})

// SEO meta
useHead({
    title: computed(() =>
        moodboard.value ? `${project.value?.title} - Moodboard` : 'Moodboard'
    ),
    meta: [
        { name: 'robots', content: 'noindex, nofollow' }, // Private moodboards
    ],
})

// Handle errors
if (error.value) {
    throw createError({
        statusCode: 404,
        statusMessage: 'Moodboard non trouvé',
    })
}
</script>

<style></style>