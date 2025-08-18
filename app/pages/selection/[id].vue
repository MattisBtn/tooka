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
                    :images="mutableImages" :total-images="store.totalImages" :current-page="store.currentPage"
                    :page-size="store.pageSize" :loading="store.loading" :can-interact="store.canInteract"
                    :selected-count="store.selectedCount" :max-allowed="store.maxAllowed"
                    :extra-count="store.extraCount" :extra-price="store.extraPrice" @page-change="handlePageChange"
                    @toggle-selection="handleToggleSelection" />

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
            <SelectionActionModals v-model:show-validate-dialog="actions.showValidateDialog.value"
                v-model:show-request-revisions-dialog="actions.showRequestRevisionsDialog.value"
                v-model:revision-comment="actions.revisionComment.value"
                :validating-selection="actions.validatingSelection.value"
                :requesting-revisions="actions.requestingRevisions.value" :selected-count="store.selectedCount"
                :max-allowed="store.maxAllowed" :extra-count="store.extraCount" :extra-price="store.extraPrice"
                @validate="actions.validateSelection" @request-revisions="actions.requestRevisions" />

            <!-- Footer -->
            <SharedClientFooter />
        </div>
    </ClientOnly>
</template>

<script setup lang="ts">
import { useClientSelectionActions } from '~/composables/selections/client/useClientSelectionActions'
import { useClientConfig } from '~/composables/shared/useClientConfig'
import { useErrorHandler } from '~/composables/shared/useErrorHandler'
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
const { getSelectionErrorConfig } = useClientConfig();
const errorConfig = getSelectionErrorConfig();

// Error handler
const { createNuxtError } = useErrorHandler();

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

// Handle page change
const handlePageChange = (page: number) => {
    store.loadPage(page);
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
watchEffect(() => {
    if (store.error) {
        throw createNuxtError(store.error.message);
    }
});
</script>

<style></style>