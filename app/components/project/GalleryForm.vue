<template>
    <UForm id="gallery-form" :schema="schema" :state="state" class="relative space-y-6" @submit="handleSubmit">
        <!-- Loading Overlay -->
        <div v-if="isSubmitting || uploading"
            class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div class="text-center">
                <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ uploading ? 'Upload en cours...' : 'Sauvegarde...' }}
                </p>
            </div>
        </div>

        <!-- Gallery Configuration -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-settings" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Configuration de la galerie</h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Paramètres de livraison et de paiement</p>
                </div>
            </div>

            <!-- Payment Configuration -->
            <div class="space-y-4">
                <UFormField label="Paiement requis pour téléchargement" name="payment_required">
                    <USwitch v-model="state.payment_required" color="primary" size="md" />
                </UFormField>

                <!-- Pricing Information Display -->
                <div v-if="pricing"
                    class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-lucide-info" class="w-4 h-4 text-blue-500" />
                        <span class="text-sm font-medium text-blue-900 dark:text-blue-100">Informations de
                            tarification</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span class="text-blue-700 dark:text-blue-300">Prix total :</span>
                            <p class="font-semibold text-blue-900 dark:text-blue-100">{{ formattedBasePrice }}</p>
                        </div>
                        <div>
                            <span class="text-blue-700 dark:text-blue-300">Acompte payé :</span>
                            <p class="font-semibold text-blue-900 dark:text-blue-100">{{ formattedDepositPaid }}</p>
                        </div>
                        <div>
                            <span class="text-blue-700 dark:text-blue-300">Reste à payer :</span>
                            <p class="font-semibold text-blue-900 dark:text-blue-100">{{ formattedRemainingAmount }}</p>
                        </div>
                    </div>

                    <div class="mt-3 text-xs text-blue-600 dark:text-blue-400">
                        {{ state.payment_required
                            ? 'Le client devra payer le montant restant pour télécharger les images.'
                            : 'Le téléchargement sera gratuit pour le client.' }}
                    </div>
                </div>

                <!-- Payment Required Info -->
                <UAlert v-if="state.payment_required" color="warning" variant="soft" icon="i-lucide-credit-card"
                    title="Paiement requis">
                    <template #description>
                        Le client devra effectuer le paiement du solde restant avant de pouvoir télécharger les images
                        de la galerie.
                    </template>
                </UAlert>

                <UAlert v-else color="success" variant="soft" icon="i-lucide-gift" title="Téléchargement gratuit">
                    <template #description>
                        Le client pourra télécharger toutes les images gratuitement une fois la galerie validée.
                    </template>
                </UAlert>
            </div>
        </div>

        <USeparator />

        <!-- Images Section -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-upload" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Images de la galerie</h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        <template v-if="hasExistingImages">
                            Gérez vos images existantes et ajoutez-en de nouvelles
                        </template>
                        <template v-else>
                            Uploadez vos images (jusqu'à 200+ images supportées)
                        </template>
                    </p>
                </div>
            </div>

            <!-- Existing Images -->
            <div v-if="hasExistingImages" class="space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Images existantes ({{ images.length }})
                    </h3>
                </div>

                <ProjectGalleryImageGrid :images="Array.from(images)" :can-delete="true"
                    @delete-image="handleDeleteExistingImage" />

                <USeparator />
            </div>

            <!-- New Images Upload -->
            <div class="space-y-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    <template v-if="hasExistingImages">Ajouter de nouvelles images</template>
                    <template v-else>Uploader des images</template>
                </h3>
                <ProjectGalleryImageUploadField v-model="selectedFiles" :max-files="200" />
            </div>

            <!-- Upload Progress -->
            <div v-if="uploading"
                class="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-upload" class="w-5 h-5 text-blue-500 animate-pulse" />
                    <div class="flex-1">
                        <div
                            class="flex items-center justify-between text-sm font-medium text-blue-900 dark:text-blue-100">
                            <span>Upload des images en cours...</span>
                            <span>{{ uploadProgress }}%</span>
                        </div>
                        <div class="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                :style="{ width: `${uploadProgress}%` }" />
                        </div>
                        <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Veuillez patienter, ne fermez pas cette page...
                        </p>
                    </div>
                </div>
            </div>

            <!-- Summary -->
            <div v-if="totalImageCount > 0" class="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <UIcon name="i-lucide-images" class="w-4 h-4" />
                    <span>
                        Total : {{ totalImageCount }} image{{ totalImageCount > 1 ? 's' : '' }}
                        <span v-if="hasExistingImages && hasSelectedFiles">
                            ({{ images.length }} existante{{ images.length > 1 ? 's' : '' }} + {{ selectedFiles.length
                            }}
                            nouvelle{{ selectedFiles.length > 1 ? 's' : '' }})
                        </span>
                    </span>
                </div>
            </div>
        </div>

        <USeparator />

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <UIcon name="i-lucide-info" class="w-4 h-4" />
                <span>Vous pouvez modifier les paramètres et gérer les images</span>
            </div>

            <div class="flex items-center gap-3">
                <UButton color="neutral" variant="ghost" label="Annuler" :disabled="isSubmitting || uploading"
                    @click="$emit('cancel')" />
                <UButton type="submit" variant="outline" color="neutral"
                    :loading="(isSubmitting && submitAsDraft) || uploading"
                    :disabled="(isSubmitting && !submitAsDraft) || uploading" icon="i-lucide-save"
                    label="Enregistrer en brouillon" @click="submitAsDraft = true" />
                <UButton type="submit" color="primary" :loading="(isSubmitting && !submitAsDraft) || uploading"
                    :disabled="(isSubmitting && submitAsDraft) || uploading" icon="i-lucide-send"
                    label="Valider et envoyer" @click="submitAsDraft = false" />
            </div>
        </div>
    </UForm>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from "@nuxt/ui";
import { useGalleryForm } from "~/composables/galleries/user/useGalleryForm";
import type { Gallery, GalleryImage, GalleryPricing } from "~/types/gallery";

interface Props {
    gallery?: Gallery;
    projectId: string;
    pricing?: GalleryPricing;
    existingImages?: GalleryImage[];
}

interface Emits {
    (e: "gallery-saved", data: { gallery: Gallery; projectUpdated: boolean; selectedFiles?: File[] }): void;
    (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Use the gallery form composable
const {
    state,
    schema,
    selectedFiles: _selectedFiles,
    images,
    uploading,
    uploadProgress,
    hasSelectedFiles,
    hasExistingImages,
    totalImageCount,
    formattedBasePrice,
    formattedDepositPaid,
    formattedRemainingAmount,
    addFiles,
    clearFiles,
    removeExistingImage,
} = useGalleryForm(props.gallery, props.existingImages, props.pricing);

// Create a writable version for the upload field
const selectedFiles = computed({
    get: () => [..._selectedFiles.value],
    set: (files: File[]) => {
        clearFiles();
        addFiles(files);
    }
});

// Local loading state for form submission
const isSubmitting = ref(false);
const submitAsDraft = ref(false);

// Handle existing image deletion
const handleDeleteExistingImage = async (imageId: string) => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.');
    if (!confirmed) return;

    await removeExistingImage(imageId);
};

// Handle form submission
const handleSubmit = async (event: FormSubmitEvent<typeof state>) => {
    isSubmitting.value = true;

    try {
        const shouldValidate = !submitAsDraft.value;

        // Create gallery data with proper structure
        const galleryData = {
            ...event.data,
            project_id: props.projectId,
            id: props.gallery?.id || '',
            created_at: props.gallery?.created_at || '',
            updated_at: props.gallery?.updated_at || '',
        } as Gallery;

        // Emit the gallery data to parent component for handling
        emit("gallery-saved", {
            gallery: galleryData,
            projectUpdated: shouldValidate,
            selectedFiles: hasSelectedFiles.value ? selectedFiles.value : undefined
        });

    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped>
/* Add any custom styles here */
</style>