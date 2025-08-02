<template>
    <UForm id="selection-form" :schema="schema" :state="state" class="relative space-y-6" @submit="handleSubmit">
        <!-- Loading Overlay -->
        <div v-if="isSubmitting || uploading"
            class="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div class="text-center">
                <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
                <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {{ uploading ? 'Upload en cours...' : 'Sauvegarde...' }}
                </p>
            </div>
        </div>

        <!-- Warning for completed selections -->
        <UAlert v-if="!canEditSelection" color="error" variant="soft" icon="i-lucide-lock" title="Sélection verrouillée"
            class="mb-6">
            <template #description>
                Cette sélection a été validée par le client et ne peut plus être modifiée.
            </template>
        </UAlert>

        <!-- Selection Configuration -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-settings" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Configuration de la
                        sélection
                    </h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Paramètres de sélection et tarification
                    </p>
                </div>
            </div>

            <!-- Form Fields -->
            <div class="space-y-4">
                <UFormField label="Nombre maximum de médias sélectionnables" name="max_media_selection" required
                    class="w-full">
                    <UInput v-model="state.max_media_selection" type="number" :min="1" :max="1000" placeholder="Ex: 30"
                        :disabled="isFormDisabled" class="w-full" />
                </UFormField>

                <UFormField label="Prix d'un média supplémentaire (€)" name="extra_media_price" class="w-full">
                    <UInput v-model="state.extra_media_price" type="number" :min="0" step="0.01" placeholder="Ex: 15.00"
                        :disabled="isFormDisabled" class="w-full" />
                </UFormField>
            </div>

            <!-- Selection Purpose Info -->
            <UAlert color="info" variant="soft" icon="i-lucide-mouse-pointer-click" title="Objectif de la sélection">
                <template #description>
                    La sélection permet au client de choisir ses médias préférés parmi ceux que vous proposez.
                    Définissez un nombre maximum et un prix pour les médias supplémentaires si souhaité.
                </template>
            </UAlert>
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
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Images à sélectionner</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        <template v-if="hasExistingImages">
                            Gérez vos images existantes et ajoutez-en de nouvelles
                        </template>
                        <template v-else>
                            Uploadez les images parmi lesquelles le client pourra choisir
                        </template>
                    </p>
                </div>
            </div>

            <!-- Existing Images -->
            <div v-if="hasExistingImages" class="space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Images de la sélection ({{ images.length }})
                        <span v-if="selectedCount > 0" class="text-orange-600 dark:text-orange-400">
                            - {{ selectedCount }} sélectionnée{{ selectedCount > 1 ? 's' : '' }} par le client
                        </span>
                    </h3>
                    <UButton v-if="canEditSelection" icon="i-lucide-trash-2" size="sm" variant="outline" color="error"
                        label="Supprimer toutes les images" :loading="isDeletingAllImages"
                        @click="handleDeleteAllImages" />
                </div>

                <ProjectSelectionImageGrid :images="Array.from(images)" :can-delete="canEditSelection"
                    :can-toggle-selection="false" :show-selection-state="true"
                    @delete-image="handleDeleteExistingImage" />

                <USeparator />
            </div>

            <!-- New Images Upload -->
            <div class="space-y-3">
                <h3 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    <template v-if="hasExistingImages">Ajouter de nouvelles images</template>
                    <template v-else>Uploader des images pour la sélection</template>
                </h3>
                <div v-if="!canEditSelection" class="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
                    <UIcon name="i-lucide-lock" class="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        Upload désactivé - sélection verrouillée
                    </p>
                </div>
                <ProjectSelectionImageUploadField v-else v-model="selectedFiles" :max-files="200" />
            </div>

            <!-- Upload Progress -->
            <div v-if="uploading"
                class="space-y-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-upload" class="w-5 h-5 text-orange-500 animate-pulse" />
                    <div class="flex-1">
                        <div
                            class="flex items-center justify-between text-sm font-medium text-orange-900 dark:text-orange-100">
                            <span>Upload des images en cours...</span>
                            <span>{{ uploadProgress }}%</span>
                        </div>
                        <div class="mt-2 w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
                            <div class="bg-orange-600 h-2 rounded-full transition-all duration-300"
                                :style="{ width: `${uploadProgress}%` }" />
                        </div>
                        <p class="text-xs text-orange-700 dark:text-orange-300 mt-1">
                            Veuillez patienter, ne fermez pas cette page...
                        </p>
                    </div>
                </div>
            </div>

            <!-- Summary -->
            <div v-if="totalImageCount > 0" class="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <UIcon name="i-lucide-images" class="w-4 h-4" />
                    <span>
                        Total : {{ totalImageCount }} image{{ totalImageCount > 1 ? 's' : '' }} disponibles
                        <span v-if="hasExistingImages && hasSelectedFiles">
                            ({{ images.length }} existante{{ images.length > 1 ? 's' : '' }} + {{ selectedFiles.length
                            }}
                            nouvelle{{ selectedFiles.length > 1 ? 's' : '' }})
                        </span>
                    </span>
                </div>
                <div v-if="selectedCount > 0"
                    class="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 mt-1">
                    <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
                    <span>
                        {{ selectedCount }} image{{ selectedCount > 1 ? 's' : '' }} sélectionnée{{ selectedCount > 1
                            ? 's' :
                            '' }} par le client
                    </span>
                </div>
            </div>

            <!-- Tips for selection images -->
            <UAlert color="success" variant="soft" icon="i-lucide-lightbulb" title="Conseils pour vos images">
                <template #description>
                    <ul class="text-sm space-y-1 mt-2">
                        <li>• Proposez plus d'images que le nombre maximum sélectionnable</li>
                        <li>• Variez les cadrages et les moments pour donner le choix au client</li>
                        <li>• <strong>Sélection :</strong> Seul le client peut sélectionner ses images préférées</li>
                        <li>• <strong>Votre rôle :</strong> Fournir un choix varié et de qualité pour faciliter la
                            sélection</li>
                        <li>• <strong>Formats RAW :</strong> Les fichiers RAW (NEF, DNG, CR2, ARW) seront
                            automatiquement convertis en JPEG</li>
                    </ul>
                </template>
            </UAlert>
        </div>

        <USeparator />

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <UIcon name="i-lucide-info" class="w-4 h-4" />
                <span v-if="isEditMode && props.selection?.status === 'revision_requested'">
                    Le client a demandé des révisions - vous pouvez modifier la sélection et la renvoyer ou la repasser
                    en
                    brouillon
                </span>
                <span v-else-if="isEditMode && props.selection?.status === 'awaiting_client'">
                    Sélection envoyée au client - vous pouvez continuer à la modifier ou la repasser en brouillon
                </span>
                <span v-else-if="isEditMode && props.selection?.status === 'draft'">
                    Sélection en brouillon - vous pouvez la modifier librement et l'envoyer au client quand elle sera
                    prête
                </span>
                <span v-else>
                    La sélection reste modifiable jusqu'à validation par le client
                </span>
            </div>

            <div class="flex items-center gap-3">
                <UButton color="neutral" variant="ghost" label="Annuler" :disabled="isSubmitting || uploading"
                    @click="$emit('cancel')" />

                <!-- Boutons pour sélection déjà envoyée au client -->
                <template
                    v-if="canEditSelection && isEditMode && (props.selection?.status === 'awaiting_client' || props.selection?.status === 'revision_requested')">
                    <UButton type="submit" variant="outline" color="neutral"
                        :loading="(isSubmitting && submitAsDraft) || uploading"
                        :disabled="(isSubmitting && !submitAsDraft) || uploading" icon="i-lucide-file-edit"
                        label="Repasser en brouillon" @click="submitAsDraft = true" />
                    <UButton type="submit" color="primary" :loading="(isSubmitting && !submitAsDraft) || uploading"
                        :disabled="(isSubmitting && submitAsDraft) || uploading" icon="i-lucide-send"
                        :label="props.selection?.status === 'revision_requested' ? 'Renvoyer au client' : 'Enregistrer les modifications'"
                        @click="submitAsDraft = false" />
                </template>

                <!-- Boutons pour nouvelle sélection ou brouillon -->
                <template v-else-if="canEditSelection">
                    <UButton type="submit" variant="outline" color="neutral"
                        :loading="(isSubmitting && submitAsDraft) || uploading"
                        :disabled="(isSubmitting && !submitAsDraft) || uploading" icon="i-lucide-save"
                        label="Sauvegarder en brouillon" @click="submitAsDraft = true" />
                    <UButton type="submit" color="primary" :loading="(isSubmitting && !submitAsDraft) || uploading"
                        :disabled="(isSubmitting && submitAsDraft) || uploading" icon="i-lucide-send"
                        label="Valider et envoyer" @click="submitAsDraft = false" />
                </template>
            </div>
        </div>
    </UForm>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from "@nuxt/ui";
import {
    selectionFormSchema,
    type Selection,
    type SelectionFormData,
    type SelectionImage,
} from "~/types/selection";

interface Props {
    selection?: Selection;
    projectId: string;
    existingImages?: SelectionImage[];
}

interface Emits {
    (e: "selection-saved", data: { selection: SelectionFormData; projectUpdated: boolean; selectedFiles?: File[] }): void;
    (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Form state
const state = reactive<SelectionFormData>({
    max_media_selection: props.selection?.max_media_selection || 10,
    extra_media_price: props.selection?.extra_media_price || null,
    status: (props.selection?.status || "draft") as "draft" | "awaiting_client" | "revision_requested" | "completed" | "payment_pending",
});

// File upload states
const selectedFiles = ref<File[]>([]);
const uploading = ref(false);
const uploadProgress = ref(0);

// Existing images management
const images = ref<SelectionImage[]>([...(props.existingImages || [])]);
const isDeletingAllImages = ref(false);

// Validation schema
const schema = selectionFormSchema;

// Local loading state for form submission
const isSubmitting = ref(false);
const submitAsDraft = ref(false);

// Computed
const isEditMode = computed(() => !!props.selection);
const hasSelectedFiles = computed(() => selectedFiles.value.length > 0);
const hasExistingImages = computed(() => images.value.length > 0);
const totalImageCount = computed(() => images.value.length + selectedFiles.value.length);
const selectedCount = computed(() => images.value.filter(img => img.is_selected).length);

// Permission check - prevent editing completed selections
const canEditSelection = computed(() => {
    return !props.selection || props.selection.status !== 'completed'
});

// Prevent any action if selection is completed
const isFormDisabled = computed(() => {
    return !canEditSelection.value || isSubmitting.value || uploading.value
});

// Handle existing image deletion
const handleDeleteExistingImage = async (imageId: string) => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.');
    if (!confirmed) return;

    try {
        const { selectionService } = await import("~/services/selectionService");
        await selectionService.deleteImage(imageId);

        // Remove from local state
        images.value = images.value.filter((img) => img.id !== imageId);

        const toast = useToast();
        toast.add({
            title: "Image supprimée",
            description: "L'image a été supprimée avec succès.",
            icon: "i-lucide-check-circle",
            color: "success",
        });
    } catch (err) {
        console.error("Error deleting image:", err);
        const toast = useToast();
        toast.add({
            title: "Erreur",
            description: err instanceof Error ? err.message : "Une erreur est survenue lors de la suppression.",
            icon: "i-lucide-alert-circle",
            color: "error",
        });
    }
};

// Handle delete all images
const handleDeleteAllImages = async () => {
    const confirmed = window.confirm(
        `Êtes-vous sûr de vouloir supprimer toutes les images (${images.value.length}) ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    isDeletingAllImages.value = true;

    try {
        const { selectionService } = await import("~/services/selectionService");

        // Delete all images in parallel
        const deletePromises = images.value.map(img => selectionService.deleteImage(img.id));
        await Promise.all(deletePromises);

        // Clear local state
        images.value = [];

        const toast = useToast();
        toast.add({
            title: "Images supprimées",
            description: "Toutes les images ont été supprimées avec succès.",
            icon: "i-lucide-check-circle",
            color: "success",
        });
    } catch (err) {
        console.error("Error deleting all images:", err);
        const toast = useToast();
        toast.add({
            title: "Erreur",
            description: err instanceof Error ? err.message : "Une erreur est survenue lors de la suppression.",
            icon: "i-lucide-alert-circle",
            color: "error",
        });
    } finally {
        isDeletingAllImages.value = false;
    }
};

// Handle form submission
const handleSubmit = async (event: FormSubmitEvent<typeof state>) => {
    isSubmitting.value = true;

    try {
        // Determine the new status based on user action
        let newStatus: "draft" | "awaiting_client";

        if (submitAsDraft.value) {
            newStatus = "draft";
        } else {
            newStatus = "awaiting_client";
        }

        // Create selection data - don't include timestamps for new selections
        const selectionFormData = {
            ...event.data,
            status: newStatus, // Explicitly set the status
        };

        // Emit the selection data to parent component for handling
        emit("selection-saved", {
            selection: selectionFormData,
            projectUpdated: newStatus === "awaiting_client",
            selectedFiles: hasSelectedFiles.value ? selectedFiles.value : undefined
        });

    } finally {
        isSubmitting.value = false;
    }
};

// Watch for file changes to clean up old object URLs
watch(() => selectedFiles.value, (newFiles, oldFiles) => {
    if (oldFiles) {
        // Clean up removed files
        oldFiles.forEach(oldFile => {
            if (!newFiles.some(newFile => newFile === oldFile)) {
                // File was removed, clean up its object URL
                const url = URL.createObjectURL(oldFile);
                URL.revokeObjectURL(url);
            }
        });
    }
}, { deep: true });

// Cleanup on unmount
onUnmounted(() => {
    // Clean up all object URLs
    selectedFiles.value.forEach(file => {
        const url = URL.createObjectURL(file);
        URL.revokeObjectURL(url);
    });
});
</script>

<style scoped>
/* Add any custom styles here */
</style>