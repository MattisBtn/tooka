<template>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
        <div class="max-w-4xl mx-auto">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    Démonstration - Éditeur Notion-like
                </h1>
                <p class="text-neutral-600 dark:text-neutral-400">
                    Testez le nouvel éditeur avec slash menu et blocs de contenu
                </p>
            </div>

            <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                <div class="mb-4">
                    <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                        Instructions
                    </h2>
                    <ul class="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                        <li>Tapez "/" dans n'importe quel bloc pour ouvrir le menu de commandes</li>
                        <li>Utilisez Entrée pour créer un nouveau bloc</li>
                        <li>Utilisez Backspace sur un bloc vide pour le supprimer</li>
                        <li>Utilisez Ctrl+↑/↓ pour naviguer entre les blocs</li>
                        <li>Hover sur un bloc pour voir les actions (drag, add, delete)</li>
                    </ul>
                </div>

                <NotionEditor v-model="content" :readonly="false" class="min-h-[400px]" />
            </div>

            <div
                class="mt-8 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Aperçu HTML
                </h2>
                <div class="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg">
                    <pre
                        class="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{{ previewHtml }}</pre>
                </div>
            </div>

            <div
                class="mt-8 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Données JSON
                </h2>
                <div class="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg">
                    <pre
                        class="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{{ JSON.stringify(content, null, 2) }}</pre>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import NotionEditor from '~/components/project/proposal/NotionEditor.vue';
import type { NotionBlock } from '~/types/notion';

// Contenu de démonstration
const content = ref<NotionBlock[]>([
    {
        id: '1',
        type: 'heading1',
        content: 'Proposition Commerciale',
        order: 1
    },
    {
        id: '2',
        type: 'paragraph',
        content: 'Bienvenue dans notre nouvelle proposition commerciale. Cet éditeur vous permet de créer du contenu riche avec différents types de blocs.',
        order: 2
    },
    {
        id: '3',
        type: 'heading2',
        content: 'Nos Services',
        order: 3
    },
    {
        id: '4',
        type: 'bulletList',
        content: 'Service 1\nService 2\nService 3',
        order: 4
    }
]);

// Générer l'aperçu HTML
const previewHtml = computed(() => {
    return content.value
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
</script>
