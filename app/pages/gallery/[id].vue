<template>
  <div>
    <!-- Password form if needed -->
    <GalleryPasswordForm v-if="needsPassword && !isAuthenticated" :project="project" :error="authError"
      @authenticated="handleAuthentication" />

    <!-- Gallery view -->
    <GalleryClientView v-else-if="gallery && isAuthenticated && project" :gallery-id="galleryId" :gallery="gallery"
      :project="project" :images="images" :has-more="hasMore" :loading-more="loadingMore" :load-more="loadMore" />

    <!-- Loading state -->
    <div v-else-if="loading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Chargement de la galerie...</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else class="min-h-screen flex items-center justify-center p-4">
      <UCard class="w-full max-w-lg text-center">
        <div class="space-y-6">
          <div class="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Galerie non trouvée
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Cette galerie n'existe pas ou n'est plus accessible.
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-500">
              Vérifiez le lien fourni ou contactez votre photographe.
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClientGallery } from '~/composables/galleries/useClientGallery';
definePageMeta({
  layout: 'gallery'
})
// Get gallery ID from route
const route = useRoute();
const galleryId = route.params.id as string;

// Use client gallery composable with infinite scroll
const {
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
  verifyPassword,
  loadMore,
} = await useClientGallery(galleryId);

// Handle password authentication
const handleAuthentication = async (password: string) => {
  await verifyPassword(password);
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
    statusMessage: "Galerie non trouvée",
  });
}
</script>

<style></style>