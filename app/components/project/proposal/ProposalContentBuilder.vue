<template>
    <div>
        <!-- Trigger Button -->
        <UButton icon="i-lucide-file-text" size="lg" variant="outline" color="primary" :label="contentPreview"
            class="w-full justify-start text-left" :class="{ 'text-neutral-500': !title }" @click="openModal" />

        <!-- Fullscreen Modal -->
        <UModal v-model:open="isOpen" :fullscreen="true" :transition="true">
            <template #content>
                <div class="flex h-full bg-neutral-50 dark:bg-neutral-900">
                    <!-- Left Sidebar - Components Palette -->
                    <div
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

                        <!-- Metadata Fields -->
                        <div class="p-4 border-b border-neutral-200 dark:border-neutral-700">
                            <div class="space-y-3">
                                <UFormField label="Titre de la proposition" name="title" required>
                                    <UInput v-model="tempTitle"
                                        placeholder="Ex: Proposition shooting mariage Sarah & Thomas" size="sm" />
                                </UFormField>
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
                                    <UIcon name="i-lucide-monitor" class="w-5 h-5 text-neutral-500" />
                                    <div>
                                        <h2 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                            Canvas de construction
                                        </h2>
                                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                            Cliquez sur un élément pour le configurer
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <div class="text-sm text-neutral-500">
                                        {{ sortedComponents.length }} élément{{ sortedComponents.length > 1 ? 's' : ''
                                        }}
                                    </div>
                                    <UButton :icon="isPreviewMode ? 'i-lucide-edit' : 'i-lucide-eye'"
                                        :label="isPreviewMode ? 'Éditer' : 'Aperçu'" size="sm" variant="outline"
                                        @click="togglePreviewMode" />
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
                                        Commencez votre proposition
                                    </h3>
                                    <p class="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                                        Ajoutez des éléments depuis la palette de gauche pour construire votre contenu
                                    </p>
                                    <UButton icon="i-lucide-plus" label="Ajouter un titre" size="lg" variant="outline"
                                        @click="addComponent('title')" />
                                </div>

                                <!-- Components in Canvas -->
                                <div v-else class="space-y-4">
                                    <!-- Preview Mode -->
                                    <div v-if="isPreviewMode"
                                        class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8">
                                        <div class="prose prose-lg max-w-none dark:prose-invert">
                                            <div v-for="component in sortedComponents" :key="component.id" class="mb-6"
                                                :class="getAlignmentClass(component.alignment)">
                                                <!-- Title Component -->
                                                <div v-if="component.type === 'title'">
                                                    <h1 v-if="(component as TitleComponent).level === 1"
                                                        class="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                                                        {{ component.content }}
                                                    </h1>
                                                    <h2 v-else-if="(component as TitleComponent).level === 2"
                                                        class="text-3xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                                                        {{ component.content }}
                                                    </h2>
                                                    <h3 v-else
                                                        class="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                                                        {{ component.content }}
                                                    </h3>
                                                </div>

                                                <!-- Paragraph Component -->
                                                <div v-else-if="component.type === 'paragraph'">
                                                    <p
                                                        class="text-neutral-700 dark:text-neutral-300 leading-relaxed text-lg">
                                                        {{ component.content }}
                                                    </p>
                                                </div>

                                                <!-- List Component -->
                                                <div v-else-if="component.type === 'list'">
                                                    <ul v-if="(component as ListComponent).listType === 'bulleted'"
                                                        class="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300 text-lg">
                                                        <li v-for="item in (component as ListComponent).items"
                                                            :key="item">
                                                            {{ item }}
                                                        </li>
                                                    </ul>
                                                    <ol v-else
                                                        class="list-decimal list-inside space-y-2 text-neutral-700 dark:text-neutral-300 text-lg">
                                                        <li v-for="item in (component as ListComponent).items"
                                                            :key="item">
                                                            {{ item }}
                                                        </li>
                                                    </ol>
                                                </div>

                                                <!-- Button Component -->
                                                <div v-else-if="component.type === 'button'" class="my-6">
                                                    <UButton :label="(component as ButtonComponent).text"
                                                        :variant="(component as ButtonComponent).variant"
                                                        :size="(component as ButtonComponent).size"
                                                        :to="(component as ButtonComponent).link"
                                                        :disabled="!(component as ButtonComponent).link"
                                                        class="inline-flex" />
                                                </div>

                                                <!-- Separator Component -->
                                                <div v-else-if="component.type === 'separator'"
                                                    :class="getSeparatorSpacingClass((component as SeparatorComponent).spacing)">
                                                    <!-- Line separator -->
                                                    <hr v-if="(component as SeparatorComponent).style === 'line'"
                                                        class="border-neutral-300 dark:border-neutral-600">

                                                    <!-- Dashed separator -->
                                                    <hr v-else-if="(component as SeparatorComponent).style === 'dashed'"
                                                        class="border-neutral-300 dark:border-neutral-600 border-dashed">

                                                    <!-- Dotted separator -->
                                                    <hr v-else-if="(component as SeparatorComponent).style === 'dotted'"
                                                        class="border-neutral-300 dark:border-neutral-600 border-dotted border-2">

                                                    <!-- Space separator -->
                                                    <div v-else-if="(component as SeparatorComponent).style === 'space'"
                                                        class="w-full" />

                                                    <!-- Ornament separator -->
                                                    <div v-else-if="(component as SeparatorComponent).style === 'ornament'"
                                                        class="flex items-center justify-center">
                                                        <div class="flex items-center space-x-2 text-neutral-400">
                                                            <div class="w-2 h-2 bg-current rounded-full" />
                                                            <div class="w-2 h-2 bg-current rounded-full" />
                                                            <div class="w-2 h-2 bg-current rounded-full" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Edit Mode -->
                                    <template v-else>
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

                <!-- Configuration Drawer -->
                <UDrawer v-model:open="configDrawerOpen" direction="right" :overlay="false">
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
import { useProposalContentBuilder, type ButtonComponent, type ListComponent, type ParagraphComponent, type SeparatorComponent, type TitleComponent } from '~/composables/proposals/useProposalContentBuilder';
import ButtonBuilder from './builder/ButtonBuilder.vue';
import ComponentRenderer from './builder/ComponentRenderer.vue';
import ListBuilder from './builder/ListBuilder.vue';
import ParagraphBuilder from './builder/ParagraphBuilder.vue';
import SeparatorBuilder from './builder/SeparatorBuilder.vue';
import TitleBuilder from './builder/TitleBuilder.vue';

interface Props {
    title: string;
    description?: string | null;
    status: 'draft' | 'awaiting_client' | 'revision_requested' | 'completed';
}

interface Emits {
    (e: 'update:title' | 'update:description', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Use the composable
const {
    isOpen,
    tempTitle,
    sortedComponents,
    selectedComponentId,
    selectedComponent,
    configDrawerOpen,
    contentPreview,
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
        title: props.title,
        description: props.description,
        status: props.status,
    },
    {
        onSave: (title: string, description: string) => {
            emit('update:title', title);
            emit('update:description', description);
        },
    }
);

// Override saveAndClose to include emit
const saveAndClose = () => {
    baseSaveAndClose();
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

// Helper function for alignment (also used in preview)
const getAlignmentClass = (alignment: 'left' | 'center' | 'right') => {
    switch (alignment) {
        case 'center': return 'text-center';
        case 'right': return 'text-right';
        default: return 'text-left';
    }
};

const getSeparatorSpacingClass = (spacing: 'small' | 'medium' | 'large') => {
    switch (spacing) {
        case 'small': return 'py-2';
        case 'large': return 'py-8';
        default: return 'py-4';
    }
};
</script>