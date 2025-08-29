<template>
    <ClientOnly>
        <Teleport to=".notion-editor">
            <div v-if="isOpen" data-image-action-menu
                class="fixed z-[9999] bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-xl w-48"
                :style="menuStyle">
                <!-- Actions -->
                <div class="py-1">
                    <button
                        class="w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-3"
                        @click="handleReplace">
                        <div
                            class="w-8 h-8 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                            <UIcon name="i-lucide-replace" class="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div class="flex-1">
                            <div class="font-medium text-neutral-900 dark:text-neutral-100 text-sm">Remplacer</div>
                            <div class="text-xs text-neutral-500 dark:text-neutral-400">Changer l'image</div>
                        </div>
                    </button>

                    <button
                        class="w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-3"
                        @click="handleDelete">
                        <div class="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                            <UIcon name="i-lucide-trash-2" class="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div class="flex-1">
                            <div class="font-medium text-neutral-900 dark:text-neutral-100 text-sm">Supprimer</div>
                            <div class="text-xs text-neutral-500 dark:text-neutral-400">Supprimer l'image</div>
                        </div>
                    </button>
                </div>

                <!-- Input caché pour remplacement -->
                <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelect">
            </div>
        </Teleport>
    </ClientOnly>

</template>

<script lang="ts" setup>
interface Props {
    isOpen: boolean;
    position: { x: number; y: number } | null;
}

interface Emits {
    (e: 'replace', file: File): void;
    (e: 'delete' | 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const fileInput = ref<HTMLInputElement>();

const menuStyle = computed(() => {
    if (!props.position) return {};

    return {
        left: `${props.position.x}px`,
        top: `${props.position.y}px`,
    };
});

const handleReplace = () => {
    fileInput.value?.click();
};

const handleDelete = () => {
    emit('delete');
    emit('close');
};

const onFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
        emit('replace', file);
        emit('close');
    }
    // Reset input
    target.value = '';
};

// Gestion des touches clavier
const handleKeydown = (event: KeyboardEvent) => {
    if (!props.isOpen) return;

    if (event.key === 'Escape') {
        event.preventDefault();
        emit('close');
    }
};

// Click outside to close
const handleClickOutside = (event: Event) => {
    if (!props.isOpen) return;

    const target = event.target as HTMLElement;
    const menu = document.querySelector('[data-image-action-menu]') as HTMLElement;

    if (menu && !menu.contains(target)) {
        emit('close');
    }
};

onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', handleClickOutside);
});
</script>
