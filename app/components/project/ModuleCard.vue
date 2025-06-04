<template>
    <UCard variant="outline">
        <template #header>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <UIcon :name="icon" :class="`w-5 h-5 ${iconColor}`" />
                    <div>
                        <h3 class="font-semibold">{{ title }}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">{{ description }}</p>
                    </div>
                </div>
                <USwitch :model-value="enabled" color="primary" size="md" @update:model-value="handleToggle" />
            </div>
        </template>

        <div v-if="enabled" class="space-y-4">
            <UAlert color="info" variant="soft" icon="i-lucide-info" title="Module activé"
                :description="`Vous pouvez maintenant configurer ${title.toLowerCase()} pour ce projet.`" />
            <!-- TODO: Add module-specific configuration -->
            <slot name="content" />
        </div>

        <template v-if="completed" #footer>
            <UAlert color="success" variant="soft" icon="i-lucide-check-circle" :title="`${title} configuré`"
                :description="summary || `${title} prêt`" />
        </template>
    </UCard>
</template>

<script lang="ts" setup>
interface Props {
    title: string
    description: string
    icon: string
    iconColor: string
    enabled: boolean
    completed?: boolean
    summary?: string | null
}

interface Emits {
    (e: 'update:enabled', value: boolean): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleToggle = (value: boolean) => {
    emit('update:enabled', value)
}
</script>