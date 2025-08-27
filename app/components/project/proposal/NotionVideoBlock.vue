<template>
    <div ref="videoContainer" class="relative group">
        <!-- Zone d'upload quand pas de vidéo -->
        <div v-if="!hasVideo && !isUploading"
            class="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            @click="openActionMenu" @dragover.prevent @drop.prevent="handleDrop">
            <input ref="fileInput" type="file" accept="video/*" class="hidden" @change="handleFileSelect">
            <div class="flex flex-col items-center gap-3">
                <div class="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-video-plus" class="w-6 h-6 text-neutral-500" />
                </div>
                <div class="text-neutral-600 dark:text-neutral-400">
                    <p class="font-medium">Cliquez pour ajouter une vidéo</p>
                    <p class="text-sm">ou glissez-déposez ici</p>
                    <p class="text-xs mt-1">Max 100MB • MP4, WebM, MOV</p>
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

        <!-- Vidéo uploadée -->
        <div v-else-if="hasVideo" class="relative">
            <!-- Vidéo embed -->
            <div v-if="videoType === 'embed'" class="relative">
                <iframe :src="embedUrl" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen class="w-full aspect-video rounded-lg shadow-sm" />
            </div>

            <!-- Vidéo upload -->
            <div v-else-if="videoType === 'upload'" class="relative">
                <video controls class="w-full rounded-lg shadow-sm">
                    <source :src="uploadedVideoUrl" type="video/mp4">
                    Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
            </div>


        </div>

        <!-- Erreur -->
        <div v-if="errorMessage"
            class="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        </div>

        <!-- Menu d'actions -->
        <VideoActionMenu :is-open="actionMenuOpen" :position="actionMenuPosition" :has-video="hasVideo"
            @upload="handleUploadFromMenu" @embed="handleEmbedFromMenu" @delete="deleteVideo"
            @close="closeActionMenu" />
    </div>
</template>

<script lang="ts" setup>
import { videoService } from '~/services/videoService';
import type { VideoBlockMetadata } from '~/types/notion';
import VideoActionMenu from './VideoActionMenu.vue';

interface Props {
    blockId: string;
    videoUrl?: string;
    metadata?: VideoBlockMetadata;
    readonly?: boolean;
    isSelected?: boolean;
}

interface Emits {
    (e: 'update', data: { content: string; metadata: VideoBlockMetadata }): void;
    (e: 'delete'): void;
}

const props = withDefaults(defineProps<Props>(), {
    readonly: false,
    isSelected: false
});

const emit = defineEmits<Emits>();

// Refs
const fileInput = ref<HTMLInputElement>();
const videoContainer = ref<HTMLElement>();

// État local
const isUploading = ref(false);
const errorMessage = ref('');
const isHovered = ref(false);

// Menu d'actions
const actionMenuOpen = ref(false);
const actionMenuPosition = ref<{ x: number; y: number } | null>(null);



// Computed
const videoType = computed(() => props.metadata?.videoType);
const hasVideo = computed(() => {
    if (videoType.value === 'embed') return props.metadata?.url;
    if (videoType.value === 'upload') return props.metadata?.filePath;
    return false;
});

const embedUrl = computed(() => {
    if (videoType.value === 'embed' && props.metadata?.url) {
        return getEmbedUrl(props.metadata.url, props.metadata.provider);
    }
    return '';
});

const uploadedVideoUrl = computed(() => {
    if (videoType.value === 'upload' && props.metadata?.filePath) {
        return videoService.getVideoUrl(props.metadata.filePath);
    }
    return '';
});

// Gestion du survol
onMounted(() => {
    if (videoContainer.value) {
        videoContainer.value.addEventListener('mouseenter', () => {
            isHovered.value = true;
        });
        videoContainer.value.addEventListener('mouseleave', () => {
            isHovered.value = false;
        });
    }
});

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
        uploadVideo(file);
    }
};

// Gestion du drag & drop
const handleDrop = (event: DragEvent) => {
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('video/')) {
        uploadVideo(file);
    }
};

// Upload de vidéo
const uploadVideo = async (file: File) => {
    errorMessage.value = '';
    isUploading.value = true;

    try {
        const result = await videoService.uploadVideo(file);

        const metadata: VideoBlockMetadata = {
            videoType: 'upload',
            filePath: result.filePath,
            fileName: result.fileName,
            fileSize: result.fileSize
        };

        emit('update', {
            content: result.fileName,
            metadata
        });
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Erreur lors de l\'upload';
        console.error('Upload error:', error);
    } finally {
        isUploading.value = false;
    }
};

// Upload depuis le menu
const handleUploadFromMenu = async (file: File) => {
    closeActionMenu();
    await uploadVideo(file);
};

// Embed depuis le menu
const handleEmbedFromMenu = (url: string) => {
    closeActionMenu();

    const provider = videoService.detectProvider(url);
    const metadata: VideoBlockMetadata = {
        videoType: 'embed',
        url: url.trim(),
        provider
    };

    emit('update', {
        content: url.trim(),
        metadata
    });
};

// Suppression de vidéo
const deleteVideo = async () => {
    if (props.metadata?.videoType === 'upload' && props.metadata?.filePath) {
        await videoService.deleteVideo(props.metadata.filePath);
    }
    emit('delete');
};



// Fonction utilitaire pour convertir URL en embed
const getEmbedUrl = (url: string, provider?: string): string => {
    if (provider === 'youtube') {
        const videoId = extractYouTubeId(url);
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (provider === 'vimeo') {
        const videoId = extractVimeoId(url);
        return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
    if (provider === 'dailymotion') {
        const videoId = extractDailymotionId(url);
        return videoId ? `https://www.dailymotion.com/embed/video/${videoId}` : url;
    }
    return url;
};

const extractYouTubeId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
};

const extractVimeoId = (url: string): string | null => {
    const patterns = [
        /vimeo\.com\/(\d+)/,
        /player\.vimeo\.com\/video\/(\d+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
};

const extractDailymotionId = (url: string): string | null => {
    const patterns = [
        /dailymotion\.com\/video\/([^&\n?#]+)/,
        /dailymotion\.com\/embed\/video\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
};
</script>
