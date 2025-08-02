<template>
    <ClientOnly>
        <div class="min-h-screen bg-white dark:bg-neutral-900">
            <!-- Headers avec conditions mutuellement exclusives -->
            <!-- Moodboard Header - affiché seulement quand tout est chargé et authentifié -->
            <MoodboardHeader v-if="moodboard && isAuthenticated && project" :project="project" :moodboard="moodboard"
                :is-authenticated="isAuthenticated" :show-logout-button="project?.hasPassword && isAuthenticated"
                @validate="handleValidate" @request-revisions="handleRequestRevisions" @logout="handleLogout" />

            <!-- Simple header pour tous les autres états -->
            <SharedSimpleHeader v-else :config="simpleHeaderConfig" />

            <!-- Content avec padding approprié -->
            <div :class="{ 'pt-16': moodboard && isAuthenticated && project }">
                <!-- Password form if needed -->
                <SharedClientPasswordForm v-if="needsPassword && !isAuthenticated" :project="project"
                    :moodboard-id="moodboardId" :error="authError" :config="passwordConfig"
                    @authenticated="handleAuthentication" />

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
                <SharedErrorState v-else :config="errorConfig" />
            </div>

            <!-- Action Modals -->
            <MoodboardActionModals v-model:show-validate-dialog="showValidateDialog"
                v-model:show-request-revisions-dialog="showRequestRevisionsDialog"
                v-model:revision-comment="revisionComment" :validating-moodboard="validatingMoodboard"
                :requesting-revisions="requestingRevisions" @validate="validateMoodboard"
                @request-revisions="requestRevisions" />

            <!-- Footer -->
            <SharedClientFooter :config="footerConfig" />
        </div>
    </ClientOnly>
</template>

<script setup lang="ts">
import { useClientMoodboard } from '~/composables/moodboards/client/useClientMoodboard'
import { useClientConfig } from '~/composables/shared/useClientConfig'
import { usePasswordFormConfig } from '~/composables/shared/usePasswordFormConfig'
import { useSimpleHeaderConfig } from '~/composables/shared/useSimpleHeaderConfig'

definePageMeta({
    layout: false,
})

// Get moodboard ID from route
const route = useRoute()
const moodboardId = route.params.id as string

// Get password form configuration
const { getMoodboardConfig } = usePasswordFormConfig();
const passwordConfig = getMoodboardConfig();

// Get simple header configuration
const { getMoodboardConfig: getMoodboardHeaderConfig } = useSimpleHeaderConfig();
const simpleHeaderConfig = getMoodboardHeaderConfig();

// Get error and footer configurations
const { getMoodboardErrorConfig, getMoodboardFooterConfig } = useClientConfig();
const errorConfig = getMoodboardErrorConfig();
const footerConfig = getMoodboardFooterConfig();

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
        message: 'Moodboard non trouvé',
    })
}
</script>

<style></style>