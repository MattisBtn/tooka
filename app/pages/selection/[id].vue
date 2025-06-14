<template>
    <ClientOnly>
        <div class="min-h-screen bg-white dark:bg-neutral-900">
            <!-- Headers avec conditions mutuellement exclusives -->
            <!-- Selection Header - affiché seulement quand tout est chargé et authentifié -->
            <SelectionHeader v-if="selection && isAuthenticated && project" :project="project" :selection="selection"
                :is-authenticated="isAuthenticated" :show-logout-button="project?.hasPassword && isAuthenticated"
                :selected-count="selectedCount" :max-allowed="maxAllowed" :extra-count="extraCount"
                :extra-price="extraPrice" @validate="handleValidate" @request-revisions="handleRequestRevisions"
                @logout="handleLogout" />

            <!-- Simple header pour tous les autres états -->
            <SelectionSimpleHeader v-else />

            <!-- Content avec padding approprié -->
            <div :class="{ 'pt-16': selection && isAuthenticated && project }">
                <!-- Password form if needed -->
                <SelectionPasswordForm v-if="needsPassword && !isAuthenticated" :project="project"
                    :selection-id="selectionId" :error="authError" @authenticated="handleAuthentication" />

                <!-- Selection view -->
                <SelectionClientView v-else-if="selection && isAuthenticated && project" :selection-id="selectionId"
                    :selection="selection" :project="project" :images="mutableImages" :has-more="hasMore"
                    :loading-more="loadingMore" :can-interact="canInteract" :selected-count="selectedCount"
                    :max-allowed="maxAllowed" :extra-count="extraCount" :extra-price="extraPrice"
                    :updating-image-id="updatingImageId" @load-more="loadMore"
                    @toggle-selection="handleToggleSelection" />

                <!-- Loading state -->
                <div v-else-if="loading" class="min-h-screen flex items-center justify-center">
                    <div class="text-center">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-amber-600 animate-spin mx-auto mb-4" />
                        <p class="text-neutral-600 dark:text-neutral-400">Chargement de la sélection...</p>
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
                                    Sélection non trouvée
                                </h1>
                                <p class="text-neutral-600 dark:text-neutral-400 mb-4">
                                    Cette sélection n'existe pas ou n'est plus accessible.
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
            <SelectionActionModals v-model:show-validate-dialog="showValidateDialog"
                v-model:show-request-revisions-dialog="showRequestRevisionsDialog"
                v-model:revision-comment="revisionComment" :validating-selection="validatingSelection"
                :requesting-revisions="requestingRevisions" :selected-count="selectedCount" :max-allowed="maxAllowed"
                :extra-count="extraCount" :extra-price="extraPrice" @validate="validateSelection"
                @request-revisions="requestRevisions" />

            <!-- Footer -->
            <footer class="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 py-8">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center">
                        <p class="text-sm text-neutral-500 dark:text-neutral-400">
                            Powered by
                            <span class="font-medium text-amber-600 dark:text-amber-400">Tooka</span>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    </ClientOnly>
</template>

<script setup lang="ts">
import { useClientSelection } from '~/composables/selections/client/useClientSelection'

definePageMeta({
    layout: false,
})

// Get selection ID from route
const route = useRoute()
const selectionId = route.params.id as string

// Use client selection composable with all functionality
const {
    // Core data
    project,
    selection,
    images,
    loading,
    loadingMore,
    error,
    needsPassword,
    isAuthenticated,
    authError,
    hasMore,
    canInteract,

    // Selection calculations
    selectedCount,
    maxAllowed,
    extraCount,
    extraPrice,

    // Action states
    validatingSelection,
    requestingRevisions,
    updatingImageId,

    // Modal states
    showValidateDialog,
    showRequestRevisionsDialog,

    // Form state
    revisionComment,

    // Core actions
    verifyPassword,
    loadMore,

    // Client actions
    validateSelection,
    requestRevisions,
    toggleImageSelection,

    // Auth methods
    logout,
} = await useClientSelection(selectionId)

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

// Handle image selection toggle
const handleToggleSelection = async (imageId: string) => {
    await toggleImageSelection(imageId)
}

// Convert readonly images to mutable for component props
const mutableImages = computed(() => {
    return images.value.map(image => ({
        ...image,
    }))
})

// SEO meta
useHead({
    title: computed(() =>
        selection.value ? `${project.value?.title} - Sélection` : 'Sélection'
    ),
    meta: [
        { name: 'robots', content: 'noindex, nofollow' }, // Private selections
    ],
})

// Handle errors
if (error.value) {
    throw createError({
        statusCode: 404,
        statusMessage: 'Sélection non trouvée',
    })
}
</script>

<style></style>