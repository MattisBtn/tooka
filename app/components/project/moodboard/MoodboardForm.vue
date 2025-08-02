<template>
    <UForm id="moodboard-form" :schema="schema" :state="state" class="space-y-6" @submit="handleSubmit">
        <!-- Moodboard Information -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-image" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations du moodboard
                    </h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Titre, description et images d'inspiration
                    </p>
                </div>
            </div>

            <!-- Form Fields -->
            <div class="grid grid-cols-1 gap-4">
                <UFormField label="Titre du moodboard" name="title" required>
                    <UInput v-model="state.title" placeholder="Ex: Inspiration photographique mariage" class="w-full" />
                </UFormField>

                <UFormField label="Description" name="description">
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
                    <UButton icon="i-lucide-trash-2" size="sm" variant="outline" color="error"
                        label="Supprimer toutes les images" :loading="isDeletingAllImages"
                        @click="handleDeleteAllImages" />
                </div>

                <ProjectMoodboardImageGrid :images="Array.from(images)" :can-delete="true" :is-editing="true"
                    @delete-image="handleDeleteExistingImage" />

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

        <!-- Form Actions -->
        <div class="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="emit('cancel')" />

            <UButton type="submit" label="Sauvegarder comme brouillon" color="neutral" variant="outline"
                :loading="isSubmitting && submitAsDraft" @click="submitAsDraft = true" />

            <UButton type="submit" label="Envoyer au client" color="primary" :loading="isSubmitting && !submitAsDraft"
                @click="submitAsDraft = false" />
        </div>
    </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { moodboardFormSchema, type Moodboard, type MoodboardFormData, type MoodboardImage } from "~/types/moodboard";

interface Props {
    moodboard?: Moodboard;
    projectId: string;
    existingImages?: MoodboardImage[];
}

interface Emits {
    (e: "moodboard-saved", data: {
        moodboard: MoodboardFormData;
        projectUpdated: boolean;
        selectedFiles?: File[]
    }): void;
    (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Form state
const state = reactive<MoodboardFormData>({
    title: props.moodboard?.title || "",
    description: props.moodboard?.description || null,
    status: props.moodboard?.status || "draft",
});

// File upload states
const selectedFiles = ref<File[]>([]);

// Existing images management
const images = ref<MoodboardImage[]>([...(props.existingImages || [])]);
const isDeletingAllImages = ref(false);

// Validation schema
const schema = moodboardFormSchema;

// Local loading state for form submission
const isSubmitting = ref(false);
const submitAsDraft = ref(false);

// Computed
const hasSelectedFiles = computed(() => selectedFiles.value.length > 0);
const hasExistingImages = computed(() => images.value.length > 0);
const totalImageCount = computed(() => images.value.length + selectedFiles.value.length);

// Handle existing image deletion
const handleDeleteExistingImage = async (imageId: string) => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.');
    if (!confirmed) return;

    try {
        const { moodboardService } = await import("~/services/moodboardService");
        await moodboardService.deleteImage(imageId);

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
        const { moodboardService } = await import("~/services/moodboardService");
        await moodboardService.deleteAllImages(props.moodboard?.id || '');

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
const handleSubmit = async (_event: FormSubmitEvent<MoodboardFormData>) => {
    isSubmitting.value = true;
    try {
        // Determine the new status based on user action
        let newStatus: "draft" | "awaiting_client";

        if (submitAsDraft.value) {
            newStatus = "draft";
        } else {
            newStatus = "awaiting_client";
        }

        // Emit the moodboard data to parent component for handling
        emit("moodboard-saved", {
            moodboard: {
                ...state,
                status: newStatus,
            },
            projectUpdated: newStatus === "awaiting_client",
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