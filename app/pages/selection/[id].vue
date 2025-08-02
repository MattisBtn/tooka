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
            <SharedSimpleHeader v-else :config="simpleHeaderConfig" />

            <!-- Content avec padding approprié -->
            <div :class="{ 'pt-16': selection && isAuthenticated && project }">
                <!-- Password form if needed -->
                <SharedClientPasswordForm v-if="needsPassword && !isAuthenticated" :project="project"
                    :selection-id="selectionId" :error="authError" :config="passwordConfig"
                    @authenticated="handleAuthentication" />

                <!-- Selection view -->
                <SelectionClientView v-else-if="selection && isAuthenticated && project" :selection-id="selectionId"
                    :selection="selection" :project="project" :images="mutableImages" :has-more="hasMore"
                    :loading-more="loadingMore" :can-interact="canInteract" :selected-count="selectedCount"
                    :max-allowed="maxAllowed" :extra-count="extraCount" :extra-price="extraPrice" @load-more="loadMore"
                    @toggle-selection="handleToggleSelection" />

                <!-- Loading state -->
                <div v-else-if="loading" class="min-h-screen flex items-center justify-center">
                    <div class="text-center">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-amber-600 animate-spin mx-auto mb-4" />
                        <p class="text-neutral-600 dark:text-neutral-400">Chargement de la sélection...</p>
                    </div>
                </div>

                <!-- Error state -->
                <SharedErrorState v-else :config="errorConfig" />
            </div>

            <!-- Action Modals -->
            <SelectionActionModals v-model:show-validate-dialog="showValidateDialog"
                v-model:show-request-revisions-dialog="showRequestRevisionsDialog"
                v-model:revision-comment="revisionComment" :validating-selection="validatingSelection"
                :requesting-revisions="requestingRevisions" :selected-count="selectedCount" :max-allowed="maxAllowed"
                :extra-count="extraCount" :extra-price="extraPrice" @validate="validateSelection"
                @request-revisions="requestRevisions" />

            <!-- Footer -->
            <SharedClientFooter :config="footerConfig" />
        </div>
    </ClientOnly>
</template>

<script setup lang="ts">
import { useClientSelection } from '~/composables/selections/client/useClientSelection'
import { useClientConfig } from '~/composables/shared/useClientConfig'
import { usePasswordFormConfig } from '~/composables/shared/usePasswordFormConfig'
import { useSimpleHeaderConfig } from '~/composables/shared/useSimpleHeaderConfig'

definePageMeta({
    layout: false,
})

// Get selection ID from route
const route = useRoute()
const selectionId = route.params.id as string

// Get password form configuration
const { getSelectionConfig } = usePasswordFormConfig();
const passwordConfig = getSelectionConfig();

// Get simple header configuration
const { getSelectionConfig: getSelectionHeaderConfig } = useSimpleHeaderConfig();
const simpleHeaderConfig = getSelectionHeaderConfig();

// Get error and footer configurations
const { getSelectionErrorConfig, getSelectionFooterConfig } = useClientConfig();
const errorConfig = getSelectionErrorConfig();
const footerConfig = getSelectionFooterConfig();

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
        message: 'Sélection non trouvée',
    })
}
</script>

<style></style>