<template>
  <ClientOnly>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
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
          :gallery="store.gallery" :project="store.project" :images="store.images" :has-more="store.hasMore"
          :loading-more="store.loadingMore" @load-more="store.loadMore" />

        <!-- Loading state -->
        <div v-else-if="store.loading" class="min-h-screen flex items-center justify-center">
          <div class="text-center">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
            <p class="text-neutral-600 dark:text-neutral-400">Chargement de la galerie...</p>
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
          :formatted-remaining-amount="store.formattedRemainingAmount" @validate="actions.validateGallery"
          @confirm-payment="actions.confirmPayment" @request-revisions="actions.requestRevisions" />

        <!-- Footer -->
        <SharedClientFooter :config="footerConfig" />
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useClientGalleryActions } from '~/composables/galleries/client/useClientGalleryActions';
import { useClientConfig } from '~/composables/shared/useClientConfig';
import { usePasswordFormConfig } from '~/composables/shared/usePasswordFormConfig';
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
const { getGalleryErrorConfig, getGalleryFooterConfig } = useClientConfig();
const errorConfig = getGalleryErrorConfig();
const footerConfig = getGalleryFooterConfig();

// Store and actions
const store = useClientGalleryStore();
const actions = useClientGalleryActions();

// Load gallery data
await store.loadGallery(galleryId);

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

// SEO meta
useHead({
  title: computed(() => (store.gallery ? `${store.project?.title}` : "Galerie")),
  meta: [{ name: "robots", content: "noindex, nofollow" }],
});

// Handle errors
watchEffect(() => {
  if (store.error) {
    throw createError({
      statusCode: 404,
      message: "Galerie non trouvée",
    });
  }
});
</script>

<style></style>