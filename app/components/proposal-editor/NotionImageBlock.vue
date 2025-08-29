<template>
    <div ref="imageContainer" class="relative group">
        <!-- Zone d'upload quand pas d'image -->
        <div v-if="!imageUrl && !isUploading"
            class="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelect">
            <div class="flex flex-col items-center gap-3">
                <div class="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-image-plus" class="w-6 h-6 text-neutral-500" />
                </div>
                <div class="text-neutral-600 dark:text-neutral-400">
                    <p class="font-medium">Cliquez pour ajouter une image</p>
                    <p class="text-sm">ou glissez-déposez ici</p>
                    <p class="text-xs mt-1">Max 5MB • JPG, PNG, GIF</p>
                </div>
            </div>
        </div>

        <!-- État de chargement -->
        <div v-else-if="isUploading" class="border-2 border-dashed border-primary rounded-lg p-8 text-center">
            <div class="flex flex-col items-center gap-3">
                <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin" />
                </div>
                <div class="text-primary">
                    <p class="font-medium">Upload en cours...</p>
                    <p class="text-sm">Veuillez patienter</p>
                </div>
            </div>
        </div>

        <!-- Image uploadée -->
        <div v-else-if="imageUrl" class="relative">
            <!-- Image avec poignées de redimensionnement -->
            <div ref="resizableImage" class="relative inline-block max-w-full"
                :style="{ width: imageWidth + 'px', height: imageHeight + 'px' }">
                <img :src="imageUrl" alt="Image uploadée" class="w-full h-full object-cover rounded-lg shadow-sm"
                    @load="onImageLoad">

                <!-- Poignées de redimensionnement (visibles au survol ou sélection) -->
                <template v-if="!readonly && (isHovered || isSelected)">
                    <!-- Poignée bas-droite -->
                    <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-se-resize shadow-sm"
                        @mousedown="startResize('se', $event)" />
                    <!-- Poignée bas-centre -->
                    <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-s-resize shadow-sm"
                        @mousedown="startResize('s', $event)" />
                    <!-- Poignée droite-centre -->
                    <div class="absolute top-1/2 -right-1 transform -translate-y-1/2 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-e-resize shadow-sm"
                        @mousedown="startResize('e', $event)" />
                </template>

                <!-- Bouton d'actions (visible au survol/sélection) -->
                <div v-if="!readonly && (isHovered || isSelected)"
                    class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <UButton icon="i-lucide-more-horizontal" size="sm" color="neutral" variant="solid"
                        @click="openActionMenu" />
                </div>
            </div>
        </div>

        <!-- Erreur -->
        <div v-if="errorMessage"
            class="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        </div>

        <!-- Menu d'actions -->
        <ImageActionMenu :is-open="actionMenuOpen" :position="actionMenuPosition" @replace="handleReplaceFromMenu"
            @delete="deleteImage" @close="closeActionMenu" />
    </div>
</template>

<script lang="ts" setup>
import { notionImageService } from '~/services/notionImageService';
import type { ImageBlockMetadata } from '~/types/notion';
import ImageActionMenu from './ImageActionMenu.vue';

interface Props {
    blockId: string;
    imageUrl?: string;
    metadata?: ImageBlockMetadata;
    readonly?: boolean;
    isSelected?: boolean;
    proposalId?: string;
}

interface Emits {
    (e: 'update', data: { content: string; metadata: ImageBlockMetadata }): void;
    (e: 'delete'): void;
}

const props = withDefaults(defineProps<Props>(), {
    readonly: false,
    isSelected: false,
    proposalId: undefined
});

const emit = defineEmits<Emits>();

// Refs
const fileInput = ref<HTMLInputElement>();
const imageContainer = ref<HTMLElement>();
const resizableImage = ref<HTMLElement>();

// État local
const isUploading = ref(false);
const errorMessage = ref('');
const isHovered = ref(false);
const isResizing = ref(false);

// Menu d'actions
const actionMenuOpen = ref(false);
const actionMenuPosition = ref<{ x: number; y: number } | null>(null);

// Données de l'image
const imageWidth = ref(props.metadata?.width || 300);
const imageHeight = ref(props.metadata?.height || 200);

// URL de l'image (peut venir des props ou être générée)
const imageUrl = computed(() => props.imageUrl);

// Gestion du survol
onMounted(() => {
    if (imageContainer.value) {
        imageContainer.value.addEventListener('mouseenter', () => {
            isHovered.value = true;
        });
        imageContainer.value.addEventListener('mouseleave', () => {
            if (!isResizing.value) {
                isHovered.value = false;
            }
        });
    }
});

// Déclencher la sélection de fichier
const triggerFileInput = () => {
    fileInput.value?.click();
};

// Ouvrir le menu d'actions
const openActionMenu = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    actionMenuPosition.value = { x: rect.left, y: rect.bottom + 5 };
    actionMenuOpen.value = true;
};

// Fermer le menu d'actions
const closeActionMenu = () => {
    actionMenuOpen.value = false;
    actionMenuPosition.value = null;
};

// Gestion de la sélection de fichier
const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
        uploadImage(file);
    }
};

// Gestion du drag & drop
const handleDrop = (event: DragEvent) => {
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
        uploadImage(file);
    }
};

// Upload d'image
const uploadImage = async (file: File) => {
    errorMessage.value = '';
    isUploading.value = true;

    try {
        const result = await notionImageService.uploadImage(file, props.proposalId);

        if (result.success && result.url && result.filePath) {
            // Créer une image temporaire pour obtenir les dimensions naturelles
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const maxWidth = 600;
                const calculatedWidth = Math.min(img.width, maxWidth);
                const calculatedHeight = calculatedWidth / aspectRatio;

                imageWidth.value = calculatedWidth;
                imageHeight.value = calculatedHeight;

                const metadata: ImageBlockMetadata = {
                    filePath: result.filePath!,
                    width: calculatedWidth,
                    height: calculatedHeight
                };

                emit('update', {
                    content: result.url!,
                    metadata
                });
            };
            img.src = result.url;
        } else {
            errorMessage.value = result.error || 'Erreur lors de l\'upload';
        }
    } catch (error) {
        errorMessage.value = 'Erreur inattendue lors de l\'upload';
        console.error('Upload error:', error);
    } finally {
        isUploading.value = false;
    }
};

// Remplacement d'image depuis le menu
const handleReplaceFromMenu = async (file: File) => {
    if (!props.metadata?.filePath) return;

    errorMessage.value = '';
    isUploading.value = true;

    try {
        const result = await notionImageService.replaceImage(props.metadata.filePath, file, props.proposalId);

        if (result.success && result.url && result.filePath) {
            // Créer une image temporaire pour obtenir les nouvelles dimensions
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const maxWidth = 600;
                const calculatedWidth = Math.min(img.width, maxWidth);
                const calculatedHeight = calculatedWidth / aspectRatio;

                imageWidth.value = calculatedWidth;
                imageHeight.value = calculatedHeight;

                const metadata: ImageBlockMetadata = {
                    filePath: result.filePath!,
                    width: calculatedWidth,
                    height: calculatedHeight
                };

                emit('update', {
                    content: result.url!,
                    metadata
                });
            };
            img.src = result.url;
        } else {
            errorMessage.value = result.error || 'Erreur lors du remplacement';
        }
    } catch (error) {
        errorMessage.value = 'Erreur inattendue lors du remplacement';
        console.error('Replace error:', error);
    } finally {
        isUploading.value = false;
    }
};

// Suppression d'image
const deleteImage = async () => {
    if (props.metadata?.filePath) {
        await notionImageService.deleteImage(props.metadata.filePath);
    }
    emit('delete');
};



// Gestion du redimensionnement
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
let resizeDirection = '';

const startResize = (direction: string, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    isResizing.value = true;
    resizeDirection = direction;
    startX = event.clientX;
    startY = event.clientY;
    startWidth = imageWidth.value;
    startHeight = imageHeight.value;

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
};

const handleResize = (event: MouseEvent) => {
    if (!isResizing.value) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;

    // Calculer les nouvelles dimensions selon la direction
    if (resizeDirection.includes('e')) {
        newWidth = Math.max(100, startWidth + deltaX);
    }
    if (resizeDirection.includes('s')) {
        newHeight = Math.max(100, startHeight + deltaY);
    }

    // Pour maintenir le ratio (redimensionnement proportionnel)
    if (resizeDirection === 'se') {
        const aspectRatio = startWidth / startHeight;
        newHeight = newWidth / aspectRatio;
    }

    imageWidth.value = Math.round(newWidth);
    imageHeight.value = Math.round(newHeight);
};

const stopResize = () => {
    if (!isResizing.value) return;

    isResizing.value = false;
    isHovered.value = false;

    // Sauvegarder les nouvelles dimensions
    if (imageUrl.value) {
        const metadata: ImageBlockMetadata = {
            ...props.metadata,
            width: imageWidth.value,
            height: imageHeight.value
        };

        emit('update', {
            content: imageUrl.value,
            metadata
        });
    }

    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
};

// Chargement de l'image
const onImageLoad = (event: Event) => {
    const img = event.target as HTMLImageElement;

    // Si pas de dimensions définies, utiliser celles de l'image
    if (!props.metadata?.width || !props.metadata?.height) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const maxWidth = 600;
        const calculatedWidth = Math.min(img.naturalWidth, maxWidth);
        const calculatedHeight = calculatedWidth / aspectRatio;

        imageWidth.value = calculatedWidth;
        imageHeight.value = calculatedHeight;

        if (imageUrl.value) {
            const metadata: ImageBlockMetadata = {
                ...props.metadata,
                width: calculatedWidth,
                height: calculatedHeight
            };

            emit('update', {
                content: imageUrl.value,
                metadata
            });
        }
    }
};

// Nettoyage
onUnmounted(() => {
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
.cursor-se-resize {
    cursor: se-resize;
}

.cursor-s-resize {
    cursor: s-resize;
}

.cursor-e-resize {
    cursor: e-resize;
}
</style>
