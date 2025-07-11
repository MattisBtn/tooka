<template>
    <div>
        <!-- Readonly Mode - Display content directly -->
        <div v-if="props.readonly" class="space-y-4">
            <!-- Display content HTML directly with height limit -->
            <div v-if="previewHtml" class="relative">
                <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent"
                    v-html="previewHtml" />

                <!-- Fade overlay to indicate more content -->
                <div
                    class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-neutral-800 to-transparent pointer-events-none rounded-b-lg" />

                <!-- Expand button for long content -->
                <div class="absolute bottom-2 right-2">
                    <UButton icon="i-lucide-maximize-2" size="xs" variant="outline" color="neutral"
                        class="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm" @click="openPreviewModal" />
                </div>
            </div>

            <!-- Empty state for readonly -->
            <div v-else
                class="text-center py-8 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700">
                <UIcon name="i-lucide-file-text" class="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p class="text-neutral-600 dark:text-neutral-400">Aucun contenu défini</p>
            </div>
        </div>

        <!-- Editable Mode - Show builder trigger button -->
        <UButton v-else icon="i-lucide-file-text" size="lg" variant="outline" color="primary" :label="contentPreview"
            class="w-full justify-start text-left" @click="openModal" />

        <!-- Fullscreen Modal -->
        <UModal v-model:open="isOpen" :fullscreen="true" :transition="true">
            <template #content>
                <div class="flex h-full bg-neutral-50 dark:bg-neutral-900">
                    <!-- Left Sidebar - Components Palette (hidden in readonly mode) -->
                    <div v-if="!props.readonly"
                        class="w-80 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
                        <div class="p-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <UIcon name="i-lucide-layers" class="w-5 h-5" />
                                Palette de composants
                            </h3>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                Glissez-déposez ou cliquez pour ajouter
                            </p>
                        </div>

                        <!-- Status Display -->
                        <div class="p-4 border-b border-neutral-200 dark:border-neutral-700">
                            <div class="space-y-3">
                                <UFormField label="Status" name="status">
                                    <UBadge :color="statusColor" variant="subtle" :label="statusLabel" />
                                </UFormField>
                            </div>
                        </div>

                        <!-- Available Components -->
                        <div class="flex-1 p-4 space-y-3 overflow-y-auto">
                            <div v-for="component in availableComponents" :key="component.type"
                                class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer transition-all hover:shadow-sm group"
                                @click="addComponent(component.type as 'title' | 'paragraph' | 'list' | 'button' | 'separator')">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
                                        <UIcon :name="component.icon"
                                            class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <h4 class="font-medium text-neutral-900 dark:text-neutral-100">
                                            {{ component.label }}
                                        </h4>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                            {{ component.description }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="p-4 border-t border-neutral-200 dark:border-neutral-700">
                            <div class="flex items-center gap-2">
                                <UButton icon="i-lucide-save" size="sm" color="primary" label="Sauvegarder"
                                    class="flex-1" @click="saveAndClose" />
                                <UButton icon="i-lucide-x" size="sm" variant="ghost" color="neutral" label="Fermer"
                                    @click="closeModal" />
                            </div>
                        </div>
                    </div>

                    <!-- Central Canvas - Visual Builder -->
                    <div class="flex-1 flex flex-col">
                        <!-- Canvas Header -->
                        <div
                            class="p-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <UIcon :name="props.readonly ? 'i-lucide-eye' : 'i-lucide-monitor'"
                                        class="w-5 h-5 text-neutral-500" />
                                    <div>
                                        <h2 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                            {{ props.readonly ? 'Aperçu du contenu' : 'Canvas de construction' }}
                                        </h2>
                                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                            {{ props.readonly ? 'Visualisation complète de la proposition'
                                                : 'Cliquez sur un élément pour le configurer' }}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <div class="text-sm text-neutral-500">
                                        {{ sortedComponents.length }} élément{{ sortedComponents.length > 1 ? 's' : ''
                                        }}
                                    </div>
                                    <!-- Hide preview toggle in readonly mode -->
                                    <UButton v-if="!props.readonly"
                                        :icon="isPreviewMode ? 'i-lucide-edit' : 'i-lucide-eye'"
                                        :label="isPreviewMode ? 'Éditer' : 'Aperçu'" size="sm" variant="outline"
                                        @click="togglePreviewMode" />
                                    <UButton icon="i-lucide-x" size="sm" variant="outline" color="neutral"
                                        label="Fermer" @click="closeModal" />
                                </div>
                            </div>
                        </div>

                        <!-- Canvas Content -->
                        <div class="flex-1 p-8 overflow-y-auto">
                            <div class="max-w-4xl mx-auto">
                                <!-- Empty State -->
                                <div v-if="sortedComponents.length === 0" class="text-center py-16">
                                    <div
                                        class="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <UIcon name="i-lucide-layout-template" class="w-12 h-12 text-neutral-400" />
                                    </div>
                                    <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                        {{ props.readonly ? 'Contenu vide' : 'Commencez votre proposition' }}
                                    </h3>
                                    <p class="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                                        {{ props.readonly ? 'Aucun contenu n\'a été défini pour cette proposition.' :
                                            'Ajoutez des éléments depuis la palette de gauche pour construire votre contenu'
                                        }}
                                    </p>
                                    <UButton v-if="!props.readonly" icon="i-lucide-plus" label="Ajouter un titre"
                                        size="lg" variant="outline" @click="addComponent('title')" />
                                </div>

                                <!-- Components in Canvas -->
                                <div v-else class="space-y-4">
                                    <!-- Preview Mode - Use generated HTML (always shown in readonly mode) -->
                                    <div v-if="isPreviewMode || props.readonly"
                                        class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8">
                                        <!-- Display the exact same HTML that will be generated for clients -->
                                        <div v-html="previewHtml" />
                                    </div>

                                    <!-- Edit Mode (hidden in readonly mode) -->
                                    <template v-else-if="!props.readonly">
                                        <!-- Canvas Component -->
                                        <ComponentRenderer v-for="component in sortedComponents" :key="component.id"
                                            :component="component" :is-selected="selectedComponentId === component.id"
                                            :can-move-up="component.order > 1"
                                            :can-move-down="component.order < sortedComponents.length"
                                            @select="selectComponent(component.id)"
                                            @move="moveComponent(component.id, $event)"
                                            @remove="removeComponent(component.id)" />
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Configuration Drawer (hidden in readonly mode) -->
                <UDrawer v-if="!props.readonly" v-model:open="configDrawerOpen" direction="right" :overlay="false">
                    <template #content>
                        <div
                            class="w-80 h-full bg-white dark:bg-neutral-800 border-l border-neutral-200 dark:border-neutral-700">
                            <div class="p-4 border-b border-neutral-200 dark:border-neutral-700">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <UIcon :name="getComponentIcon(selectedComponent?.type)"
                                            class="w-5 h-5 text-primary-500" />
                                        <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                            Configuration {{ getComponentLabel(selectedComponent?.type) }}
                                        </h3>
                                    </div>
                                    <UButton icon="i-lucide-x" size="xs" variant="ghost" color="neutral"
                                        @click="deselectComponent" />
                                </div>
                            </div>

                            <div class="p-4 space-y-4">
                                <!-- Title Configuration -->
                                <TitleBuilder v-if="selectedComponent?.type === 'title'"
                                    :component="selectedComponent as TitleComponent"
                                    @update="updateComponent(selectedComponent.id, $event)" />

                                <!-- Paragraph Configuration -->
                                <ParagraphBuilder v-else-if="selectedComponent?.type === 'paragraph'"
                                    :component="selectedComponent as ParagraphComponent"
                                    @update="updateComponent(selectedComponent.id, $event)" />

                                <!-- List Configuration -->
                                <ListBuilder v-else-if="selectedComponent?.type === 'list'"
                                    :component="selectedComponent as ListComponent"
                                    @update="updateComponent(selectedComponent.id, $event)" />

                                <!-- Button Configuration -->
                                <ButtonBuilder v-else-if="selectedComponent?.type === 'button'"
                                    :component="selectedComponent as ButtonComponent"
                                    @update="updateComponent(selectedComponent.id, $event)" />

                                <!-- Separator Configuration -->
                                <SeparatorBuilder v-else-if="selectedComponent?.type === 'separator'"
                                    :component="selectedComponent as SeparatorComponent"
                                    @update="updateComponent(selectedComponent.id, $event)" />
                            </div>
                        </div>
                    </template>
                </UDrawer>
            </template>
        </UModal>
    </div>
</template>

<script lang="ts" setup>
import { useProposalContentBuilder, type ButtonComponent, type ListComponent, type ParagraphComponent, type ProposalComponent, type SeparatorComponent, type TitleComponent } from '~/composables/proposals/useProposalContentBuilder';
import ButtonBuilder from './builder/ButtonBuilder.vue';
import ComponentRenderer from './builder/ComponentRenderer.vue';
import ListBuilder from './builder/ListBuilder.vue';
import ParagraphBuilder from './builder/ParagraphBuilder.vue';
import SeparatorBuilder from './builder/SeparatorBuilder.vue';
import TitleBuilder from './builder/TitleBuilder.vue';

interface Props {
    content_json: ProposalComponent[] | null
    content_html?: string
    status?: 'draft' | 'awaiting_client' | 'revision_requested' | 'completed'
    readonly?: boolean
}

interface Emits {
    (e: 'update:content_json', value: ProposalComponent[]): void;
    (e: 'update:content_html', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    content_json: null,
    content_html: '',
    status: 'draft',
    readonly: false
})

const emit = defineEmits<Emits>();

// Use the composable
const {
    isOpen,
    sortedComponents,
    selectedComponentId,
    selectedComponent,
    configDrawerOpen,
    contentPreview,
    previewHtml,
    statusColor,
    statusLabel,
    availableComponents,
    openModal,
    closeModal,
    saveAndClose: baseSaveAndClose,
    addComponent,
    removeComponent,
    updateComponent,
    moveComponent,
    selectComponent,
    deselectComponent,
    isPreviewMode,
    togglePreviewMode,
} = useProposalContentBuilder(
    {
        content_json: props.content_json,
        content_html: props.content_html,
        status: props.status,
    },
    {
        onSave: (content_json: ProposalComponent[], content_html: string) => {
            emit('update:content_json', content_json);
            emit('update:content_html', content_html);
        },
    }
);

// Override saveAndClose to include emit
const saveAndClose = () => {
    baseSaveAndClose();
};

// Method to open modal in readonly preview mode
const openPreviewModal = () => {
    if (props.readonly) {
        // Open modal and force preview mode for readonly
        openModal();
        // Force preview mode when opening in readonly
        nextTick(() => {
            if (!isPreviewMode.value) {
                togglePreviewMode();
            }
        });
    }
};

// Helper functions for drawer header
const getComponentIcon = (type?: string) => {
    switch (type) {
        case 'title': return 'i-lucide-heading';
        case 'paragraph': return 'i-lucide-type';
        case 'list': return 'i-lucide-list';
        case 'button': return 'i-lucide-mouse-pointer-click';
        case 'separator': return 'i-lucide-minus';
        default: return 'i-lucide-settings';
    }
};

const getComponentLabel = (type?: string) => {
    switch (type) {
        case 'title': return 'Titre';
        case 'paragraph': return 'Paragraphe';
        case 'list': return 'Liste';
        case 'button': return 'Bouton';
        case 'separator': return 'Séparateur';
        default: return 'Composant';
    }
};

// Helper functions no longer needed since we use generated HTML for preview
</script>