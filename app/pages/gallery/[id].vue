<template>
  <ClientOnly>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <!-- Gallery Header -->
      <GalleryHeader :project="project" :gallery="gallery" :is-authenticated="isAuthenticated"
        :downloading-gallery="downloadingGallery" :validating-gallery="validatingGallery"
        :requesting-revisions="requestingRevisions" :confirming-payment="confirmingPayment"
        :has-remaining-amount="hasRemainingAmount" :formatted-remaining-amount="formattedRemainingAmount"
        :show-logout-button="project?.hasPassword && isAuthenticated" @validate="handleValidate"
        @request-revisions="handleRequestRevisions" @pay-remaining-amount="handlePayRemainingAmount"
        @download="handleDownload" @logout="handleLogout" />

      <!-- Simple header for other states -->
      <SimpleHeader v-if="!gallery || !isAuthenticated || !project" :config="simpleHeaderConfig" />

      <!-- Content with top padding when header is fixed -->
      <div :class="{ 'pt-16': gallery && isAuthenticated && project }">
        <!-- Password form if needed -->
        <ClientPasswordForm v-if="needsPassword && !isAuthenticated" :project="project" :module-id="galleryId"
          :error="authError" :config="passwordConfig" @authenticated="handleAuthentication" />

        <!-- Gallery view -->
        <GalleryClientView v-else-if="gallery && isAuthenticated && project" :gallery-id="galleryId" :gallery="gallery"
          :project="project" :images="images" :has-more="hasMore" :loading-more="loadingMore" :load-more="loadMore" />

        <!-- Loading state -->
        <div v-else-if="loading" class="min-h-screen flex items-center justify-center">
          <div class="text-center">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
            <p class="text-neutral-600 dark:text-neutral-400">Chargement de la galerie...</p>
          </div>
        </div>

        <!-- Error state -->
        <div v-else class="min-h-screen flex items-center justify-center p-4">
          <UCard class="w-full max-w-lg text-center">
            <div class="space-y-6">
              <div
                class="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  Galerie non trouvée
                </h1>
                <p class="text-neutral-600 dark:text-neutral-400 mb-4">
                  Cette galerie n'existe pas ou n'est plus accessible.
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
      <GalleryActionModals v-model:show-validate-dialog="showValidateDialog"
        v-model:show-payment-dialog="showPaymentDialog"
        v-model:show-request-revisions-dialog="showRequestRevisionsDialog" v-model:revision-comment="revisionComment"
        :validating-gallery="validatingGallery" :requesting-revisions="requestingRevisions"
        :confirming-payment="confirmingPayment" :formatted-remaining-amount="formattedRemainingAmount"
        @validate="validateGallery" @confirm-payment="confirmPayment" @request-revisions="requestRevisions" />

      <!-- Footer -->
      <footer class="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              Powered by
              <span class="font-medium text-primary-600 dark:text-primary-400">Tooka</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useClientGallery } from '~/composables/galleries/client/useClientGallery';
import { usePasswordFormConfig } from '~/composables/shared/usePasswordFormConfig';
import { useSimpleHeaderConfig } from '~/composables/shared/useSimpleHeaderConfig';

definePageMeta({
  layout: false,
})

// Get gallery ID from route
const route = useRoute();
const galleryId = route.params.id as string;

// Get password form configuration
const { getGalleryConfig } = usePasswordFormConfig();
const passwordConfig = getGalleryConfig();

// Get simple header configuration
const { getGalleryConfig: getGalleryHeaderConfig } = useSimpleHeaderConfig();
const simpleHeaderConfig = getGalleryHeaderConfig();

// Use client gallery composable with all functionality
const {
  // Core data
  project,
  gallery,
  images,
  loading,
  loadingMore,
  error,
  needsPassword,
  isAuthenticated,
  authError,
  hasMore,

  // Payment-related
  hasRemainingAmount,
  formattedRemainingAmount,

  // Action states
  validatingGallery,
  requestingRevisions,
  downloadingGallery,
  confirmingPayment,

  // Modal states
  showValidateDialog,
  showPaymentDialog,
  showRequestRevisionsDialog,

  // Form state
  revisionComment,

  // Core actions
  verifyPassword,
  loadMore,

  // Client actions
  validateGallery,
  requestRevisions,
  confirmPayment,

  // Action handlers
  handleValidate,
  handleRequestRevisions,
  handlePayRemainingAmount,
  handleDownload,

  // Auth methods
  logout,
} = await useClientGallery(galleryId);

// Handle password authentication
const handleAuthentication = async (password: string) => {
  await verifyPassword(password);
};

// Handle logout
const handleLogout = () => {
  logout();
};

// SEO meta
useHead({
  title: computed(() =>
    gallery.value ? `${project.value?.title}` : "Galerie"
  ),
  meta: [
    { name: "robots", content: "noindex, nofollow" }, // Private galleries
  ],
});

// Handle errors
if (error.value) {
  throw createError({
    statusCode: 404,
    message: "Galerie non trouvée",
  });
}
</script>

<style></style>