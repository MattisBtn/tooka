<template>
    <ClientOnly>
        <Teleport to=".notion-editor">
            <div v-if="isOpen"
                class="fixed z-50 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-xl max-w-sm w-full"
                :style="menuStyle">
                <!-- Header -->
                <div class="p-3 border-b border-neutral-200 dark:border-neutral-700">
                    <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <UIcon name="i-lucide-slash" class="w-4 h-4" />
                        <span>Commandes</span>
                    </div>
                </div>

                <!-- Search -->
                <div class="p-3 border-b border-neutral-200 dark:border-neutral-700">
                    <UInput v-model="searchQuery" placeholder="Rechercher une commande..." size="sm"
                        icon="i-lucide-search" class="w-full" />
                </div>

                <!-- Commands list -->
                <div class="max-h-64 overflow-y-auto">
                    <div v-if="filteredCommands.length === 0"
                        class="p-4 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                        Aucune commande trouvée
                    </div>

                    <div v-else class="py-1">
                        <button v-for="(command, index) in filteredCommands" :key="command.id"
                            class="w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-3"
                            :class="{ 'bg-primary-50 dark:bg-primary-900/20': selectedIndex === index }"
                            @click="selectCommand(command)" @mouseenter="selectedIndex = index">
                            <div
                                class="w-8 h-8 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                                <UIcon :name="command.icon" class="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                                    {{ command.title }}
                                </div>
                                <div class="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                    {{ command.description }}
                                </div>
                            </div>
                            <div v-if="selectedIndex === index" class="text-primary">
                                <UIcon name="i-lucide-check" class="w-4 h-4" />
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="p-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                    <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Utilisez ↑↓ pour naviguer</span>
                        <span>Entrée pour sélectionner</span>
                    </div>
                </div>
            </div>
        </Teleport>
    </ClientOnly>
</template>

<script lang="ts" setup>
import type { SlashCommand } from '~/types/notion';

interface Props {
    isOpen: boolean;
    position: { x: number; y: number } | null;
    commands: SlashCommand[];
    selectedIndex?: number;
}

interface Emits {
    (e: 'select', command: SlashCommand): void;
    (e: 'close'): void;
    (e: 'update:selectedIndex', index: number): void;
}

const props = withDefaults(defineProps<Props>(), {
    selectedIndex: 0
});

const emit = defineEmits<Emits>();

const searchQuery = ref('');

// Filtrer les commandes selon la recherche
const filteredCommands = computed(() => {
    if (!searchQuery.value) return props.commands;

    const query = searchQuery.value.toLowerCase();
    return props.commands.filter(cmd =>
        cmd.title.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        cmd.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
});

// Style du menu positionné
const menuStyle = computed(() => {
    if (!props.position) return {};

    return {
        left: `${props.position.x}px`,
        top: `${props.position.y}px`,
    };
});

// Navigation au clavier
const selectedIndex = computed({
    get: () => props.selectedIndex,
    set: (value) => emit('update:selectedIndex', value)
});

// Sélectionner une commande
const selectCommand = (command: SlashCommand) => {
    emit('select', command);
};

// Gestion des touches clavier
const handleKeydown = (event: KeyboardEvent) => {
    if (!props.isOpen) return;

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1);
            break;
        case 'ArrowUp':
            event.preventDefault();
            selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
            break;
        case 'Enter': {
            event.preventDefault();
            const selectedCommand = filteredCommands.value[selectedIndex.value];
            if (selectedCommand) {
                selectCommand(selectedCommand);
            }
            break;
        }
        case 'Escape':
            event.preventDefault();
            emit('close');
            break;
    }
};

// Écouter les événements clavier
onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
});

// Réinitialiser la sélection quand le menu s'ouvre
watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        selectedIndex.value = 0;
        searchQuery.value = '';
    }
});

// Réinitialiser la sélection quand les commandes changent
watch(filteredCommands, () => {
    if (selectedIndex.value >= filteredCommands.value.length) {
        selectedIndex.value = Math.max(0, filteredCommands.value.length - 1);
    }
});
</script>
