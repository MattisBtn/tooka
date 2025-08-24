<template>
    <div>
        <!-- Readonly Mode - preview HTML -->
        <div v-if="props.readonly" class="space-y-4">
            <div v-if="previewHtml" class="relative">
                <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent"
                    v-html="previewHtml" />
                <div
                    class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-neutral-800 to-transparent pointer-events-none rounded-b-lg" />
                <div class="absolute bottom-2 right-2">
                    <UButton icon="i-lucide-maximize-2" size="xs" variant="outline" color="neutral"
                        class="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm" @click="openPreviewModal" />
                </div>
            </div>
            <div v-else
                class="text-center py-8 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700">
                <UIcon name="i-lucide-file-text" class="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p class="text-neutral-600 dark:text-neutral-400">Aucun contenu défini</p>
            </div>
        </div>

        <!-- Editable trigger -->
        <UButton v-else icon="i-lucide-file-text" size="lg" variant="outline" color="primary" :label="contentPreview"
            class="w-full justify-start text-left" @click="openModal" />

        <!-- Fullscreen Modal -->
        <UModal v-model:open="isOpen" :fullscreen="true" :transition="true">
            <template #content>
                <div class="flex h-full bg-neutral-50 dark:bg-neutral-900">
                    <!-- Canvas -->
                    <div class="flex-1 flex flex-col">
                        <div
                            class="p-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <UIcon :name="props.readonly ? 'i-lucide-eye' : 'i-lucide-edit-3'"
                                        class="w-5 h-5 text-neutral-500" />
                                    <div>
                                        <h2 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                            {{ props.readonly ? 'Aperçu du contenu' : 'Éditeur de proposition' }}
                                        </h2>
                                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                            {{ props.readonly ?
                                                'Visualisation complète de la proposition' :
                                            'Tapez "/" pour ajouter du contenu' }}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <div class="text-sm text-neutral-500">
                                        {{ blocks.length }} bloc{{ blocks.length > 1 ? 's' : '' }}
                                    </div>
                                    <UButton v-if="!props.readonly" icon="i-lucide-save" size="sm" color="primary"
                                        label="Sauvegarder" @click="saveAndClose" />
                                    <UButton icon="i-lucide-x" size="sm" variant="outline" color="neutral"
                                        label="Fermer" @click="closeModal" />
                                </div>
                            </div>
                        </div>

                        <div class="flex-1 p-8 overflow-y-auto">
                            <div class="max-w-4xl mx-auto">
                                <!-- Empty State -->
                                <div v-if="blocks.length === 0 && !props.readonly" class="text-center py-16">
                                    <div
                                        class="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <UIcon name="i-lucide-edit-3" class="w-12 h-12 text-neutral-400" />
                                    </div>
                                    <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                        Commencez votre proposition
                                    </h3>
                                    <p class="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                                        Tapez "/" dans l'éditeur pour ajouter des titres, paragraphes, listes et plus
                                        encore
                                    </p>
                                </div>

                                <!-- Editor -->
                                <div v-else>
                                    <div v-if="isPreviewMode || props.readonly"
                                        class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8">
                                        <div v-html="previewHtml" />
                                    </div>

                                    <NotionEditor v-else v-model="blocks" :readonly="false"
                                        class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script lang="ts" setup>
import type { NotionBlock } from '~/types/notion';
import NotionEditor from './NotionEditor.vue';

interface Props {
    contentJson?: NotionBlock[] | null;
    contentHtml?: string;
    status?: 'draft' | 'awaiting_client' | 'revision_requested' | 'completed';
    readonly?: boolean;
}

interface Emits {
    (e: 'update:content_json', value: NotionBlock[]): void;
    (e: 'update:content_html', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    contentJson: null,
    contentHtml: '',
    status: 'draft',
    readonly: false,
});

const emit = defineEmits<Emits>();

// Local state
const isOpen = ref(false);
const isPreviewMode = ref(false);
const blocks = ref<NotionBlock[]>([]);

// Initialiser les blocs
watch(() => props.contentJson, (newContent) => {
    if (newContent && Array.isArray(newContent)) {
        blocks.value = [...newContent];
    } else {
        blocks.value = [];
    }
}, { immediate: true });

// Computed
const contentPreview = computed(() => {
    if (blocks.value.length === 0) return 'Créer le contenu de la proposition';
    const firstHeading = blocks.value.find((b) => b.type.startsWith('heading'))?.content;
    if (firstHeading) return firstHeading.length > 50 ? firstHeading.substring(0, 50) + '...' : firstHeading;
    const firstText = blocks.value.find((b) => b.type === 'paragraph')?.content;
    return firstText ? (firstText.length > 80 ? firstText.substring(0, 80) + '...' : firstText) : 'Contenu de la proposition';
});

const previewHtml = computed(() => {
    return blocks.value
        .sort((a, b) => a.order - b.order)
        .map(block => {
            switch (block.type) {
                case 'heading1':
                    return `<h1 class="text-4xl font-bold mb-4">${block.content}</h1>`;
                case 'heading2':
                    return `<h2 class="text-3xl font-semibold mb-3">${block.content}</h2>`;
                case 'heading3':
                    return `<h3 class="text-2xl font-medium mb-2">${block.content}</h3>`;
                case 'paragraph':
                    return `<p class="mb-4 leading-relaxed">${block.content}</p>`;
                case 'bulletList':
                    return `<ul class="list-disc list-inside mb-4 space-y-1">${block.content.split('\n').filter(line => line.trim()).map(item => `<li>${item.trim()}</li>`).join('')}</ul>`;
                case 'numberedList':
                    return `<ol class="list-decimal list-inside mb-4 space-y-1">${block.content.split('\n').filter(line => line.trim()).map(item => `<li>${item.trim()}</li>`).join('')}</ol>`;
                case 'quote':
                    return `<blockquote class="border-l-4 border-primary pl-4 italic mb-4">${block.content}</blockquote>`;
                case 'code':
                    return `<pre class="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mb-4 overflow-x-auto"><code>${block.content}</code></pre>`;
                case 'divider':
                    return `<hr class="my-6 border-neutral-300 dark:border-neutral-600">`;
                case 'image':
                    return `<img src="${block.content}" alt="" class="max-w-full h-auto mb-4 rounded-lg">`;
                case 'table':
                    return `<div class="overflow-x-auto mb-4"><table class="w-full border-collapse border border-neutral-300 dark:border-neutral-600">${block.content}</table></div>`;
                case 'button':
                    return `<button class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors mb-4">${block.content}</button>`;
                default:
                    return `<p class="mb-4">${block.content}</p>`;
            }
        })
        .join('');
});

// Methods
const openModal = () => {
    isOpen.value = true;
};

const closeModal = () => {
    isOpen.value = false;
};

const saveAndClose = () => {
    const html = previewHtml.value;
    emit('update:content_json', [...blocks.value]);
    emit('update:content_html', html);
    closeModal();
    const toast = useToast();
    toast.add({
        title: 'Contenu sauvegardé',
        description: 'Le contenu de la proposition a été mis à jour.',
        icon: 'i-lucide-check-circle',
        color: 'success'
    });
};

const openPreviewModal = () => {
    if (props.readonly) {
        openModal();
        nextTick(() => {
            if (!isPreviewMode.value) togglePreviewMode();
        });
    }
};

const togglePreviewMode = () => {
    isPreviewMode.value = !isPreviewMode.value;
};
</script>