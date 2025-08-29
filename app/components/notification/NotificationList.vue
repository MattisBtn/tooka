<template>
    <div class="space-y-4">
        <!-- Header avec actions -->
        <div class="flex items-center justify-end">
            <UButton v-if="unreadCount > 0" size="sm" variant="subtle" color="neutral" @click="markAllAsRead">
                Marquer tout comme lu
            </UButton>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center py-8 text-red-500">
            {{ error }}
        </div>

        <!-- Empty state -->
        <div v-else-if="notifications.length === 0" class="text-center py-8 text-neutral-500">
            <UIcon name="i-heroicons-bell" class="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune notification pour le moment</p>
        </div>

        <!-- Notifications list -->
        <div v-else class="space-y-1.5">
            <div v-for="notification in notifications" :key="notification.id"
                class="group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm"
                :class="[
                    notification.is_read
                        ? 'bg-white dark:bg-gray-900 border-neutral-200 dark:border-gray-700 hover:border-neutral-300 dark:hover:border-gray-600 hover:bg-neutral-50/50 dark:hover:bg-gray-800/50'
                        : 'bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-700/50 hover:bg-red-50 dark:hover:bg-red-950/30'
                ]" @click="markAsRead(notification.id)">

                <div class="flex gap-3">
                    <!-- Icône de notification -->
                    <div class="flex-shrink-0 relative">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
                            :class="[
                                notification.is_read
                                    ? 'bg-neutral-100 dark:bg-gray-800 text-neutral-600 dark:text-gray-400 group-hover:bg-neutral-200 dark:group-hover:bg-gray-700'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/50'
                            ]">
                            <!-- Icône ou emoji selon le type -->
                            <UIcon v-if="getNotificationIcon(notification.type).startsWith('i-')"
                                :name="getNotificationIcon(notification.type)" class="w-4 h-4" />
                            <span v-else class="text-lg leading-none" :class="[
                                notification.is_read
                                    ? 'text-neutral-600 dark:text-gray-400'
                                    : 'text-red-600 dark:text-red-400'
                            ]">
                                {{ getNotificationIcon(notification.type) }}
                            </span>
                        </div>

                        <!-- Indicateur non lu sur l'icône -->
                        <div v-if="!notification.is_read"
                            class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 dark:bg-red-400 rounded-full animate-pulse" />
                    </div>

                    <!-- Contenu principal -->
                    <div class="flex-1 min-w-0 space-y-1">
                        <!-- En-tête avec titre et date -->
                        <div class="flex items-start justify-between gap-2">
                            <h4 class="font-medium text-sm text-neutral-900 dark:text-gray-100 leading-tight">
                                {{ notification.title }}
                            </h4>
                            <span class="text-xs text-neutral-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                                {{ formatRelativeDate(notification.created_at) }}
                            </span>
                        </div>

                        <!-- Message de la notification -->
                        <p class="text-xs text-neutral-600 dark:text-gray-300 leading-relaxed">
                            {{ notification.message }}
                        </p>
                    </div>
                </div>

                <!-- Effet de survol subtil -->
                <div
                    class="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { formatRelativeDate } from '~/utils/formatters'

const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    loadNotifications
} = useNotifications()

// Charger les notifications au montage du composant
onMounted(() => {
    loadNotifications()
})

// Obtenir l'icône de notification en fonction du type
const getNotificationIcon = (type: string) => {
    switch (type) {
        // Révisions demandées
        case 'moodboard_revision_requested':
            return 'i-heroicons-pencil-square'
        case 'gallery_revision_requested':
            return 'i-heroicons-photo'
        case 'selection_revision_requested':
            return 'i-heroicons-squares-2x2'
        case 'proposal_revision_requested':
            return 'i-heroicons-document-text'

        // Paiements en attente
        case 'proposal_payment_pending':
            return 'i-heroicons-credit-card'
        case 'gallery_payment_pending':
            return 'i-heroicons-credit-card'

        // Projets complétés avec paiement reçu - Icônes engageantes
        case 'proposal_completed_with_deposit':
            return '💰' // Emoji money bag pour l'acompte reçu
        case 'gallery_completed_stripe':
            return '🎉' // Emoji party pour célébrer le paiement complet

        // Fallback
        default:
            return 'i-heroicons-bell'
    }
}
</script>