<template>
    <div>
        <div class="flex justify-between items-start mb-6">
            <div class="flex flex-col">
                <div v-if="badge" class="mb-2 flex">
                    <UBadge size="lg" :color="badgeColor" :variant="badgeVariant" :icon="badgeIcon || 'i-lucide-list'">
                        {{ badge }}
                    </UBadge>
                </div>
                <h1 class="text-2xl font-bold mb-1">{{ title }}</h1>
                <p v-if="subtitle" class="text-neutral-500 dark:text-neutral-400">{{ subtitle }}</p>
            </div>
            <div class="flex items-center gap-2">
                <slot name="actions" />
            </div>
        </div>
        <USeparator v-if="separator" :color="separatorColor" :size="separatorSize" :type="separatorType" />
    </div>
</template>

<script lang="ts" setup>
interface Props {
    badge?: string
    badgeColor?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
    badgeVariant?: 'solid' | 'outline' | 'soft' | 'subtle'
    badgeIcon?: string
    title: string
    subtitle?: string
    separator?: boolean
    separatorColor?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
    separatorSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    separatorType?: 'solid' | 'dashed' | 'dotted'
}

withDefaults(defineProps<Props>(), {
    separator: true,
    separatorColor: 'neutral',
    separatorSize: 'xs',
    separatorType: 'solid'
})
</script>