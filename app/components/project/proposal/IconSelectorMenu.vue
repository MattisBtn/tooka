<template>
    <Teleport to="body">
        <div v-if="isOpen" data-icon-selector-menu
            class="fixed z-[9999] bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-xl w-80"
            :style="menuStyle">
            <!-- Header avec onglets -->
            <div class="p-3 border-b border-neutral-200 dark:border-neutral-700">
                <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-lucide-smile" class="w-4 h-4" />
                    <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Choisir une icône</span>
                </div>
                <div class="flex gap-1">
                    <UButton size="xs" variant="ghost" :color="activeTab === 'emoji' ? 'primary' : 'neutral'"
                        @click="activeTab = 'emoji'">
                        Émojis
                    </UButton>
                    <UButton size="xs" variant="ghost" :color="activeTab === 'lucide' ? 'primary' : 'neutral'"
                        @click="activeTab = 'lucide'">
                        Icônes
                    </UButton>
                </div>
            </div>

            <!-- Search -->
            <div class="p-3 border-b border-neutral-200 dark:border-neutral-700">
                <UInput v-model="searchQuery" :placeholder="searchPlaceholder" size="sm" icon="i-lucide-search"
                    class="w-full" />
            </div>

            <!-- Content -->
            <div class="max-h-64 overflow-y-auto p-3">
                <!-- Émojis -->
                <div v-if="activeTab === 'emoji'" class="grid grid-cols-8 gap-2">
                    <button v-for="emoji in filteredEmojis" :key="emoji"
                        class="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-lg"
                        @click="selectIcon(emoji, 'emoji')">
                        {{ emoji }}
                    </button>
                </div>

                <!-- Icônes Lucide -->
                <div v-else class="grid grid-cols-6 gap-2">
                    <button v-for="icon in filteredIcons" :key="icon"
                        class="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        @click="selectIcon(icon, 'lucide')">
                        <UIcon :name="`i-lucide-${icon}`" class="w-4 h-4" />
                    </button>
                </div>

                <!-- Aucun résultat -->
                <div v-if="(activeTab === 'emoji' && filteredEmojis.length === 0) || (activeTab === 'lucide' && filteredIcons.length === 0)"
                    class="text-center text-neutral-500 dark:text-neutral-400 text-sm py-8">
                    Aucun résultat trouvé
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script lang="ts" setup>
interface Props {
    isOpen: boolean;
    position: { x: number; y: number } | null;
}

interface Emits {
    (e: 'select', icon: string, type: 'emoji' | 'lucide'): void;
    (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const activeTab = ref<'emoji' | 'lucide'>('emoji');
const searchQuery = ref('');

// Liste d'émojis populaires
const emojis = [
    '💡', '⚠️', '❗', '✅', '❌', '📝', '🔥', '⭐',
    '🎯', '💰', '📊', '🔒', '🌟', '🚀', '💎', '🎉',
    '⚡', '🔔', '📢', '👀', '💻', '📱', '🌍', '🔧',
    '🎨', '📚', '🏆', '💪', '🔍', '📈', '📉', '⏰',
    '☀️', '🌙', '❤️', '💚', '💙', '💜', '🧡', '💛',
    '🤝', '👍', '👎', '✋', '👋', '🙏', '💭', '💬',
    '📁', '📂', '📄', '📋', '📌', '📍', '🔗', '🎵'
];

// Liste d'icônes Lucide populaires
const lucideIcons = [
    'lightbulb', 'alert-triangle', 'alert-circle', 'check-circle', 'x-circle',
    'info', 'help-circle', 'star', 'heart', 'bookmark',
    'bell', 'clock', 'calendar', 'map-pin', 'home',
    'user', 'users', 'mail', 'phone', 'message-circle',
    'search', 'filter', 'settings', 'tool', 'wrench',
    'edit', 'trash', 'download', 'upload', 'share',
    'lock', 'unlock', 'eye', 'eye-off', 'shield',
    'zap', 'trending-up', 'trending-down', 'activity', 'bar-chart',
    'pie-chart', 'target', 'flag', 'gift', 'trophy'
];

// Recherche dans les émojis (basée sur des mots-clés)
const emojiKeywords: Record<string, string[]> = {
    '💡': ['idee', 'ampoule', 'light', 'idea'],
    '⚠️': ['attention', 'warning', 'alerte'],
    '❗': ['important', 'exclamation'],
    '✅': ['valide', 'check', 'ok', 'correct'],
    '❌': ['erreur', 'wrong', 'non', 'error'],
    '📝': ['note', 'ecrire', 'texte'],
    '🔥': ['feu', 'hot', 'fire', 'populaire'],
    '⭐': ['star', 'etoile', 'favori'],
    '🎯': ['target', 'objectif', 'cible'],
    '💰': ['argent', 'money', 'prix'],
    '📊': ['graphique', 'stats', 'donnees'],
    '🔒': ['securite', 'prive', 'lock'],
    '🌟': ['nouveau', 'special', 'brillant'],
    '🚀': ['rapide', 'lancement', 'rocket'],
    '💎': ['premium', 'qualite', 'diamond'],
    '🎉': ['celebration', 'fete', 'party']
};

const filteredEmojis = computed(() => {
    if (!searchQuery.value) return emojis;

    const query = searchQuery.value.toLowerCase();
    return emojis.filter(emoji => {
        const keywords = emojiKeywords[emoji] || [];
        return keywords.some(keyword => keyword.includes(query));
    });
});

const filteredIcons = computed(() => {
    if (!searchQuery.value) return lucideIcons;

    const query = searchQuery.value.toLowerCase();
    return lucideIcons.filter(icon => icon.includes(query));
});

const searchPlaceholder = computed(() => {
    return activeTab.value === 'emoji' ? 'Rechercher un émoji...' : 'Rechercher une icône...';
});

const menuStyle = computed(() => {
    if (!props.position) return {};

    return {
        left: `${props.position.x}px`,
        top: `${props.position.y}px`,
    };
});

const selectIcon = (icon: string, type: 'emoji' | 'lucide') => {
    emit('select', icon, type);
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
    const menu = document.querySelector('[data-icon-selector-menu]') as HTMLElement;

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

// Réinitialiser la recherche quand le menu s'ouvre
watch(() => props.isOpen, (isOpen) => {
    console.log('IconSelectorMenu isOpen changed to:', isOpen);
    console.log('Position:', props.position);
    if (isOpen) {
        searchQuery.value = '';
        activeTab.value = 'emoji';
    }
});
</script>
