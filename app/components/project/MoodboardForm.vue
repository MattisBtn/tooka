<template>
    <UForm id="moodboard-form" :schema="schema" :state="state" class="relative space-y-6" @submit="handleSubmit">
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

        <!-- Moodboard Configuration -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-settings" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Configuration du moodboard
                    </h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Titre, description et contenu
                        d'inspiration</p>
                </div>
            </div>

            <!-- Form Fields -->
            <div class="space-y-4">
                <UFormField label="Titre du moodboard" name="title" required class="w-full">
                    <UInput v-model="state.title" placeholder="Ex: Inspiration photographique mariage" class="w-full" />
                </UFormField>

                <UFormField label="Description" name="description" class="w-full">
                    <UTextarea v-model="state.description" :rows="3"
                        placeholder="Décrivez l'ambiance, le style ou les éléments que vous souhaitez transmettre..."
                        resize class="w-full" />
                </UFormField>
            </div>

            <!-- Moodboard Purpose Info -->
            <UAlert color="info" variant="soft" icon="i-lucide-palette" title="Objectif du moodboard">
                <template #description>
                    Le moodboard permet de partager votre vision artistique avec le client et d'aligner les attentes
                    sur le style, l'ambiance et les couleurs du projet photographique.
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
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Images d'inspiration</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        <template v-if="hasExistingImages">
                            Gérez vos images existantes et ajoutez-en de nouvelles
                        </template>
                        <template v-else>
                            Uploadez des images qui représentent votre vision artistique
                        </template>
                    </p>
                </div>
            </div>

            <!-- Existing Images -->
            <div v-if="hasExistingImages" class="space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Images existantes ({{ images.length }})
                    </h3>
                </div>

                <ProjectMoodboardImageGrid :images="Array.from(images)" :can-delete="true" :can-edit-caption="true"
                    @delete-image="handleDeleteExistingImage" @update-caption="handleUpdateCaption" />

                <USeparator />
            </div>

            <!-- New Images Upload -->
            <div class="space-y-3">
                <h3 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    <template v-if="hasExistingImages">Ajouter de nouvelles images</template>
                    <template v-else>Uploader des images d'inspiration</template>
                </h3>
                <ProjectMoodboardImageUploadField v-model="selectedFiles" :max-files="50" />
            </div>

            <!-- Upload Progress -->
            <div v-if="uploading"
                class="space-y-3 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-upload" class="w-5 h-5 text-pink-500 animate-pulse" />
                    <div class="flex-1">
                        <div
                            class="flex items-center justify-between text-sm font-medium text-pink-900 dark:text-pink-100">
                            <span>Upload des images en cours...</span>
                            <span>{{ uploadProgress }}%</span>
                        </div>
                        <div class="mt-2 w-full bg-pink-200 dark:bg-pink-800 rounded-full h-2">
                            <div class="bg-pink-600 h-2 rounded-full transition-all duration-300"
                                :style="{ width: `${uploadProgress}%` }" />
                        </div>
                        <p class="text-xs text-pink-700 dark:text-pink-300 mt-1">
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
                        Total : {{ totalImageCount }} image{{ totalImageCount > 1 ? 's' : '' }} d'inspiration
                        <span v-if="hasExistingImages && hasSelectedFiles">
                            ({{ images.length }} existante{{ images.length > 1 ? 's' : '' }} + {{ selectedFiles.length
                            }}
                            nouvelle{{ selectedFiles.length > 1 ? 's' : '' }})
                        </span>
                    </span>
                </div>
            </div>

            <!-- Tips for inspiration images -->
            <UAlert color="success" variant="soft" icon="i-lucide-lightbulb" title="Conseils pour vos images">
                <template #description>
                    <ul class="text-sm space-y-1 mt-2">
                        <li>• Choisissez des images qui représentent l'ambiance souhaitée</li>
                        <li>• Variez les cadrages : plans larges, portraits, détails</li>
                        <li>• Incluez des références de couleurs et de lumière</li>
                        <li>• Ajoutez des légendes pour expliquer vos choix</li>
                    </ul>
                </template>
            </UAlert>
        </div>

        <USeparator />

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <UIcon name="i-lucide-info" class="w-4 h-4" />
                <span
                    v-if="isEditMode && (props.moodboard?.status === 'awaiting_client' || props.moodboard?.status === 'revision_requested')">
                    Modifiez le moodboard selon les besoins - les changements seront visibles par le client
                </span>
                <span v-else>
                    Le moodboard reste modifiable en permanence pour une collaboration continue
                </span>
            </div>

            <div class="flex items-center gap-3">
                <UButton color="neutral" variant="ghost" label="Annuler" :disabled="isSubmitting || uploading"
                    @click="$emit('cancel')" />

                <!-- Boutons pour moodboard déjà envoyé au client -->
                <template
                    v-if="isEditMode && (props.moodboard?.status === 'awaiting_client' || props.moodboard?.status === 'revision_requested')">
                    <UButton type="submit" variant="outline" color="neutral"
                        :loading="(isSubmitting && submitAsDraft) || uploading"
                        :disabled="(isSubmitting && !submitAsDraft) || uploading" icon="i-lucide-edit"
                        label="Repasser en brouillon" @click="submitAsDraft = true" />
                    <UButton type="submit" color="primary" :loading="(isSubmitting && !submitAsDraft) || uploading"
                        :disabled="(isSubmitting && submitAsDraft) || uploading" icon="i-lucide-save"
                        label="Enregistrer les modifications" @click="submitAsDraft = false" />
                </template>

                <!-- Boutons pour nouveau moodboard ou brouillon -->
                <template v-else>
                    <UButton type="submit" variant="outline" color="neutral"
                        :loading="(isSubmitting && submitAsDraft) || uploading"
                        :disabled="(isSubmitting && !submitAsDraft) || uploading" icon="i-lucide-save"
                        label="Enregistrer en brouillon" @click="submitAsDraft = true" />
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
import { useMoodboardForm } from "~/composables/moodboards/user/useMoodboardForm";
import type { Moodboard, MoodboardImage } from "~/types/moodboard";

interface Props {
    moodboard?: Moodboard;
    projectId: string;
    existingImages?: MoodboardImage[];
}

interface Emits {
    (e: "moodboard-saved", data: { moodboard: Moodboard; projectUpdated: boolean; selectedFiles?: File[] }): void;
    (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Use the moodboard form composable
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
    addFiles,
    clearFiles,
    removeExistingImage,
    updateImageCaption,
} = useMoodboardForm(props.moodboard, props.existingImages);

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

// Computed
const isEditMode = computed(() => !!props.moodboard);

// Handle existing image deletion
const handleDeleteExistingImage = async (imageId: string) => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.');
    if (!confirmed) return;

    await removeExistingImage(imageId);
};

// Handle caption updates
const handleUpdateCaption = async (imageId: string, caption: string | null) => {
    await updateImageCaption(imageId, caption);
};

// Handle form submission
const handleSubmit = async (event: FormSubmitEvent<typeof state>) => {
    isSubmitting.value = true;

    try {
        const shouldValidate = !submitAsDraft.value;

        // Create moodboard data with proper structure
        const moodboardData = {
            ...event.data,
            project_id: props.projectId,
            id: props.moodboard?.id || '',
            created_at: props.moodboard?.created_at || '',
            updated_at: props.moodboard?.updated_at || '',
        } as Moodboard;

        // Emit the moodboard data to parent component for handling
        emit("moodboard-saved", {
            moodboard: moodboardData,
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