<template>
    <ClientOnly>
        <div class="min-h-screen bg-white dark:bg-neutral-900">
            <!-- Headers avec conditions mutuellement exclusives -->
            <!-- Moodboard Header - affiché seulement quand tout est chargé et authentifié -->
            <MoodboardHeader v-if="store.moodboard && store.isAuthenticated && store.project" :project="store.project"
                :moodboard="store.moodboard" :is-authenticated="store.isAuthenticated"
                :show-logout-button="store.project?.hasPassword && store.isAuthenticated" @validate="handleValidate"
                @request-revisions="handleRequestRevisions" @logout="handleLogout" />

            <!-- Simple header pour tous les autres états -->
            <SharedSimpleHeader v-else :config="simpleHeaderConfig" />

            <!-- Content avec padding approprié -->
            <div :class="{ 'pt-16': store.moodboard && store.isAuthenticated && store.project }">
                <!-- Password form if needed -->
                <SharedClientPasswordForm v-if="store.needsPassword && !store.isAuthenticated" :project="store.project"
                    :moodboard-id="moodboardId" :error="store.authError" :config="passwordConfig"
                    @authenticated="handleAuthentication" />

                <!-- Moodboard view -->
                <MoodboardClientView v-else-if="store.moodboard && store.isAuthenticated && store.project"
                    :moodboard-id="moodboardId" :moodboard="store.moodboard" :project="store.project"
                    :images="mutableImages" :has-more="store.hasMore" :loading-more="store.loadingMore"
                    :can-interact="store.canInteract" :uploading-images="actions.uploadingImages.value"
                    :upload-progress="actions.uploadProgress.value" @load-more="store.loadMore"
                    @upload-images="handleUploadImages" @add-comment="handleAddComment"
                    @react-to-image="handleReactToImage" />

                <!-- Loading state -->
                <div v-else-if="store.loading" class="min-h-screen flex items-center justify-center">
                    <div class="text-center">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-pink-600 animate-spin mx-auto mb-4" />
                        <p class="text-neutral-600 dark:text-neutral-400">Chargement du moodboard...</p>
                    </div>
                </div>

                <!-- Error state -->
                <SharedErrorState v-else :config="errorConfig" />
            </div>

            <!-- Action Modals -->
            <MoodboardActionModals v-model:show-validate-dialog="actions.showValidateDialog.value"
                v-model:show-request-revisions-dialog="actions.showRequestRevisionsDialog.value"
                v-model:revision-comment="actions.revisionComment.value"
                :validating-moodboard="actions.validatingMoodboard.value"
                :requesting-revisions="actions.requestingRevisions.value" @validate="actions.validateMoodboard"
                @request-revisions="actions.requestRevisions" />

            <!-- Footer -->
            <SharedClientFooter :config="footerConfig" />
        </div>
    </ClientOnly>
</template>

<script setup lang="ts">
import { useClientMoodboardActions } from '~/composables/moodboards/client/useClientMoodboardActions'
import { useClientConfig } from '~/composables/shared/useClientConfig'
import { usePasswordFormConfig } from '~/composables/shared/usePasswordFormConfig'
import { useSimpleHeaderConfig } from '~/composables/shared/useSimpleHeaderConfig'
import { useClientMoodboardStore } from '~/stores/public/moodboard'

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

// Use client moodboard store and actions
const store = useClientMoodboardStore()
const actions = useClientMoodboardActions()

// Load moodboard data
await store.loadMoodboard(moodboardId)

// Handle password authentication
const handleAuthentication = async (password: string) => {
    await store.verifyPassword(password)
}

// Handle logout
const handleLogout = () => {
    store.logout()
}

// Handle validate action from header
const handleValidate = () => {
    actions.showValidateDialog.value = true
}

// Handle request revisions action from header
const handleRequestRevisions = () => {
    actions.showRequestRevisionsDialog.value = true
}

// Handle image upload
const handleUploadImages = async (files: File[]) => {
    await actions.uploadImages(files)
}

// Handle add comment
const handleAddComment = async (imageId: string, comment: string) => {
    await actions.addComment(imageId, comment)
}

// Handle image reaction
const handleReactToImage = async (imageId: string, reaction: 'love' | 'like' | 'dislike') => {
    await actions.reactToImage(imageId, reaction)
}

// Convert readonly images to mutable for component props
const mutableImages = computed(() => {
    return store.images.map(image => ({
        ...image,
        comments: image.comments ? Array.from(image.comments) : []
    }))
})

// SEO meta
useHead({
    title: computed(() =>
        store.moodboard ? `${store.project?.title} - Moodboard` : 'Moodboard'
    ),
    meta: [
        { name: 'robots', content: 'noindex, nofollow' }, // Private moodboards
    ],
})

// Handle errors
if (store.error) {
    throw createError({
        statusCode: 404,
        message: 'Moodboard non trouvé',
    })
}
</script>

<style></style>