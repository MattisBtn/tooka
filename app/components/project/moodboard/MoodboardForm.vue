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

                <ProjectMoodboardImageGrid :images="Array.from(images)" :can-delete="true"
                    @delete-image="handleDeleteExistingImage" />

                <USeparator />
            </div>

            <!-- New Images Upload -->
            <div class="space-y-3">
                <h3 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    <template v-if="hasExistingImages">Ajouter de nouvelles images</template>
                    <template v-else>Uploader des images d'inspiration</template>
                </h3>
                <UiImageUploadField v-model="selectedFiles" :max-files="50" :config="moodboardUploadConfig" />
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
                <span v-if="isEditMode && props.moodboard?.status === 'revision_requested'">
                    Le client a demandé des révisions - vous pouvez modifier le moodboard et le renvoyer ou le repasser
                    en
                    brouillon
                </span>
                <span v-else-if="isEditMode && props.moodboard?.status === 'awaiting_client'">
                    Moodboard envoyé au client - vous pouvez continuer à le modifier ou le repasser en brouillon
                </span>
                <span v-else-if="isEditMode && props.moodboard?.status === 'draft'">
                    Moodboard en brouillon - vous pouvez le modifier librement et l'envoyer au client quand il sera prêt
                </span>
                <span v-else>
                    Le moodboard reste modifiable en permanence pour une collaboration continue avec le client
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
                        :disabled="(isSubmitting && !submitAsDraft) || uploading" icon="i-lucide-file-edit"
                        label="Repasser en brouillon" @click="submitAsDraft = true" />
                    <UButton type="submit" color="primary" :loading="(isSubmitting && !submitAsDraft) || uploading"
                        :disabled="(isSubmitting && submitAsDraft) || uploading" icon="i-lucide-send"
                        :label="props.moodboard?.status === 'revision_requested' ? 'Renvoyer au client' : 'Enregistrer les modifications'"
                        @click="submitAsDraft = false" />
                </template>

                <!-- Boutons pour nouveau moodboard ou brouillon -->
                <template v-else>
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
    moodboardFormSchema,
    type Moodboard,
    type MoodboardFormData,
    type MoodboardImage,
} from "~/types/moodboard";

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

// Form state
const state = reactive<MoodboardFormData>({
    title: props.moodboard?.title || "",
    description: props.moodboard?.description || null,
    status: props.moodboard?.status || "draft",
});

// File upload states
const selectedFiles = ref<File[]>([]);
const uploading = ref(false);
const uploadProgress = ref(0);

// Existing images management
const images = ref<MoodboardImage[]>([...(props.existingImages || [])]);

// Validation schema
const schema = moodboardFormSchema;

// Local loading state for form submission
const isSubmitting = ref(false);
const submitAsDraft = ref(false);

// Moodboard upload configuration
const moodboardUploadConfig = {
    theme: 'pink' as const,
    mainIcon: 'i-lucide-image-plus',
    buttonIcon: 'i-lucide-palette',
    buttonLabel: 'Ajouter des images d\'inspiration',
    title: 'Glissez-déposez vos images d\'inspiration ici',
    filesLabel: 'Images d\'inspiration sélectionnées',
    indicator: {
        icon: 'i-lucide-lightbulb',
        class: 'w-4 h-4 text-yellow-400 drop-shadow-sm'
    },
    tips: {
        title: 'Conseils pour vos images d\'inspiration',
        items: [
            'Choisissez des images qui représentent l\'ambiance et le style souhaités',
            'Incluez des références de couleurs, lumière et composition',
            'Variez les sources : portraits, paysages, détails, textures'
        ]
    }
};

// Computed
const isEditMode = computed(() => !!props.moodboard);
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

        // Create moodboard data with proper structure
        const moodboardData = {
            ...event.data,
            project_id: props.projectId,
            id: props.moodboard?.id || '',
            created_at: props.moodboard?.created_at || '',
            updated_at: props.moodboard?.updated_at || '',
            status: newStatus, // Explicitly set the status
        } as Moodboard;

        // Emit the moodboard data to parent component for handling
        emit("moodboard-saved", {
            moodboard: moodboardData,
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