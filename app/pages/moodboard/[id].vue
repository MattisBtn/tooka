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
                    :images="mutableImages" :total-images="store.totalImages" :current-page="store.currentPage"
                    :page-size="store.pageSize" :loading="store.loading" :can-interact="store.canInteract"
                    :uploading-images="actions.uploadingImages.value" :upload-progress="actions.uploadProgress.value"
                    @page-change="handlePageChange" @upload-images="handleUploadImages" @add-comment="handleAddComment"
                    @react-to-image="handleReactToImage" />

                <!-- Loading state -->
                <div v-else-if="store.loading" class="min-h-screen">
                    <!-- Header skeleton -->
                    <div class="bg-white dark:bg-neutral-900">
                        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                            <div class="text-center max-w-4xl mx-auto">
                                <USkeleton class="h-16 w-64 mx-auto mb-4" />
                                <USkeleton class="h-6 w-48 mx-auto mb-8" />
                            </div>
                        </div>
                    </div>

                    <!-- Images skeleton -->
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div v-for="i in 8" :key="i" class="aspect-square rounded-lg overflow-hidden">
                                <USkeleton class="w-full h-full" />
                            </div>
                        </div>
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
            <SharedClientFooter />
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
const { getMoodboardErrorConfig } = useClientConfig();
const errorConfig = getMoodboardErrorConfig();

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

// Handle page change
const handlePageChange = (page: number) => {
    store.loadPage(page);
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