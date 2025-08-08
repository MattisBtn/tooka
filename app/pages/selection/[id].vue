<template>
    <ClientOnly>
        <div class="min-h-screen bg-white dark:bg-neutral-900">
            <!-- Headers avec conditions mutuellement exclusives -->
            <!-- Selection Header - affiché seulement quand tout est chargé et authentifié -->
            <SelectionHeader v-if="store.selection && store.isAuthenticated && store.project" :project="store.project"
                :selection="store.selection" :is-authenticated="store.isAuthenticated"
                :show-logout-button="store.project?.hasPassword && store.isAuthenticated"
                :selected-count="store.selectedCount" :max-allowed="store.maxAllowed" :extra-count="store.extraCount"
                :extra-price="store.extraPrice" @validate="handleValidate" @request-revisions="handleRequestRevisions"
                @logout="handleLogout" />

            <!-- Simple header pour tous les autres états -->
            <SharedSimpleHeader v-else :config="simpleHeaderConfig" />

            <!-- Content avec padding approprié -->
            <div :class="{ 'pt-16': store.selection && store.isAuthenticated && store.project }">
                <!-- Password form if needed -->
                <SharedClientPasswordForm v-if="store.needsPassword && !store.isAuthenticated" :project="store.project"
                    :selection-id="selectionId" :error="store.authError" :config="passwordConfig"
                    @authenticated="handleAuthentication" />

                <!-- Selection view -->
                <SelectionClientView v-else-if="store.selection && store.isAuthenticated && store.project"
                    :selection-id="selectionId" :selection="store.selection" :project="store.project"
                    :images="mutableImages" :has-more="store.hasMore" :loading-more="store.loadingMore"
                    :can-interact="store.canInteract" :selected-count="store.selectedCount"
                    :max-allowed="store.maxAllowed" :extra-count="store.extraCount" :extra-price="store.extraPrice"
                    @load-more="store.loadMore" @toggle-selection="handleToggleSelection" />

                <!-- Loading state -->
                <div v-else-if="store.loading" class="min-h-screen flex items-center justify-center">
                    <div class="text-center">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-amber-600 animate-spin mx-auto mb-4" />
                        <p class="text-neutral-600 dark:text-neutral-400">Chargement de la sélection...</p>
                    </div>
                </div>

                <!-- Error state -->
                <SharedErrorState v-else :config="errorConfig" />
            </div>

            <!-- Action Modals -->
            <SelectionActionModals v-model:show-validate-dialog="actions.showValidateDialog.value"
                v-model:show-request-revisions-dialog="actions.showRequestRevisionsDialog.value"
                v-model:revision-comment="actions.revisionComment.value"
                :validating-selection="actions.validatingSelection.value"
                :requesting-revisions="actions.requestingRevisions.value" :selected-count="store.selectedCount"
                :max-allowed="store.maxAllowed" :extra-count="store.extraCount" :extra-price="store.extraPrice"
                @validate="actions.validateSelection" @request-revisions="actions.requestRevisions" />

            <!-- Footer -->
            <SharedClientFooter :config="footerConfig" />
        </div>
    </ClientOnly>
</template>

<script setup lang="ts">
import { useClientSelectionActions } from '~/composables/selections/client/useClientSelectionActions'
import { useClientConfig } from '~/composables/shared/useClientConfig'
import { usePasswordFormConfig } from '~/composables/shared/usePasswordFormConfig'
import { useSimpleHeaderConfig } from '~/composables/shared/useSimpleHeaderConfig'
import { useClientSelectionStore } from '~/stores/public/selection'

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

// Use client selection store and actions
const store = useClientSelectionStore()
const actions = useClientSelectionActions()

// Load selection data
await store.loadSelection(selectionId)

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

// Handle image selection toggle
const handleToggleSelection = async (imageId: string) => {
    await actions.toggleImageSelection(imageId)
}

// Convert readonly images to mutable for component props
const mutableImages = computed(() => {
    return store.images.map(image => ({
        ...image,
    }))
})

// SEO meta
useHead({
    title: computed(() =>
        store.selection ? `${store.project?.title} - Sélection` : 'Sélection'
    ),
    meta: [
        { name: 'robots', content: 'noindex, nofollow' }, // Private selections
    ],
})

// Handle errors
if (store.error) {
    throw createError({
        statusCode: 404,
        message: 'Sélection non trouvée',
    })
}
</script>

<style></style>