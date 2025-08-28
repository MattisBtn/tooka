<template>
  <ClientOnly>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 screenshot-protection" @contextmenu.prevent>
      <!-- Gallery Header -->
      <GalleryHeader :project="store.project" :gallery="store.gallery" :is-authenticated="store.isAuthenticated"
        :downloading-gallery="actions.downloadingGallery.value" :validating-gallery="actions.validatingGallery.value"
        :requesting-revisions="actions.requestingRevisions.value" :confirming-payment="actions.confirmingPayment.value"
        :has-remaining-amount="store.hasRemainingAmount" :formatted-remaining-amount="store.formattedRemainingAmount"
        :show-logout-button="store.project?.hasPassword && store.isAuthenticated" @validate="handleValidate"
        @request-revisions="handleRequestRevisions" @pay-remaining-amount="handlePayRemainingAmount"
        @download="handleDownload" @logout="handleLogout" />

      <!-- Simple header for other states -->
      <SharedSimpleHeader v-if="!store.gallery || !store.isAuthenticated || !store.project"
        :config="simpleHeaderConfig" />

      <!-- Content with top padding when header is fixed -->
      <div :class="{ 'pt-16': store.gallery && store.isAuthenticated && store.project }">
        <!-- Password form if needed -->
        <SharedClientPasswordForm v-if="store.needsPassword && !store.isAuthenticated" :project="store.project"
          :module-id="galleryId" :error="store.authError" :config="passwordConfig"
          @authenticated="handleAuthentication" />

        <!-- Gallery view -->
        <GalleryClientView v-else-if="store.gallery && store.isAuthenticated && store.project" :gallery-id="galleryId"
          :gallery="store.gallery" :project="store.project" :images="store.images" :total-images="store.totalImages"
          :current-page="store.currentPage" :page-size="store.pageSize" :loading="store.loading"
          @page-change="handlePageChange" />

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

        <!-- Action Modals -->
        <GalleryActionModals v-model:show-validate-dialog="actions.showValidateDialog.value"
          v-model:show-payment-dialog="actions.showPaymentDialog.value"
          v-model:show-request-revisions-dialog="actions.showRequestRevisionsDialog.value"
          v-model:revision-comment="actions.revisionComment.value" :validating-gallery="actions.validatingGallery.value"
          :requesting-revisions="actions.requestingRevisions.value"
          :confirming-payment="actions.confirmingPayment.value"
          :formatted-remaining-amount="store.formattedRemainingAmount" :project="store.project"
          @validate="actions.validateGallery" @confirm-payment="actions.confirmPayment"
          @request-revisions="actions.requestRevisions" />

        <!-- Footer -->
        <SharedClientFooter />
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useClientGalleryActions } from '~/composables/galleries/client/useClientGalleryActions';
import { useClientConfig } from '~/composables/shared/useClientConfig';
import { useErrorHandler } from '~/composables/shared/useErrorHandler';
import { usePasswordFormConfig } from '~/composables/shared/usePasswordFormConfig';
import { useScreenshotProtection } from '~/composables/shared/useScreenshotProtection';
import { useSimpleHeaderConfig } from '~/composables/shared/useSimpleHeaderConfig';
import { useClientGalleryStore } from '~/stores/public/gallery';

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

// Get error and footer configurations
const { getGalleryErrorConfig } = useClientConfig();
const errorConfig = getGalleryErrorConfig();

// Error handler
const { createNuxtError } = useErrorHandler();

// Store and actions
const store = useClientGalleryStore();
const actions = useClientGalleryActions();

// Screenshot protection
const { enableProtection } = useScreenshotProtection();

// Load gallery data
await store.loadGallery(galleryId);

// Enable screenshot protection when gallery is loaded and authenticated
watchEffect(() => {
  if (store.gallery && store.isAuthenticated && store.project) {
    enableProtection();
  }
});

// Store methods
const verifyPassword = store.verifyPassword;
const logout = store.logout;

// Handle password authentication
const handleAuthentication = async (password: string) => {
  await verifyPassword(password);
};

// Handle logout
const handleLogout = () => {
  logout();
};

// Handle actions from header
const handleValidate = () => {
  actions.showValidateDialog.value = true;
};

const handleRequestRevisions = () => {
  actions.showRequestRevisionsDialog.value = true;
};

const handlePayRemainingAmount = () => {
  actions.showPaymentDialog.value = true;
};

const handleDownload = () => {
  actions.downloadGallery();
};

const handlePageChange = (page: number) => {
  store.loadPage(page);
};

// SEO meta
useHead({
  title: computed(() => (store.gallery ? `${store.project?.title}` : "Galerie")),
  meta: [{ name: "robots", content: "noindex, nofollow" }],
});

// Handle errors
watchEffect(() => {
  if (store.error) {
    throw createNuxtError(store.error.message);
  }
});


</script>

<style>
@import '~/assets/css/screenshot-protection.css';
</style>