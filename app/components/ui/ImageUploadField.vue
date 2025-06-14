<template>
    <div class="space-y-4">
        <!-- File Input -->
        <div class="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6 text-center hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
            :class="dropZoneClasses" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop">

            <UIcon :name="config.mainIcon" class="w-12 h-12 text-neutral-400 mx-auto mb-4" />

            <div class="space-y-2">
                <p class="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    {{ config.title }}
                </p>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    ou cliquez pour sélectionner des fichiers
                </p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                    Formats supportés: JPG, PNG, WebP • Max {{ maxFiles }} images • 10MB par image
                </p>
            </div>

            <input ref="fileInput" type="file" multiple accept="image/*" class="hidden" @change="handleFileSelect">

            <UButton :icon="config.buttonIcon" color="primary" variant="outline" :label="config.buttonLabel"
                class="mt-4" @click="fileInput?.click()" />
        </div>

        <!-- Selected Files Preview -->
        <div v-if="selectedFiles.length > 0" class="space-y-3">
            <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {{ config.filesLabel }} ({{ selectedFiles.length }})
                </h4>
                <UButton icon="i-lucide-x" size="xs" variant="ghost" color="error" label="Tout supprimer"
                    @click="clearFiles" />
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div v-for="(file, index) in selectedFiles" :key="index"
                    class="relative group aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">

                    <!-- Image Preview -->
                    <img :src="getFilePreview(file)" :alt="file.name" class="w-full h-full object-cover">

                    <!-- File Info Overlay -->
                    <div
                        class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                        <div class="text-center text-white text-xs">
                            <p class="font-medium truncate max-w-full">{{ file.name }}</p>
                            <p class="text-neutral-300">{{ formatFileSize(file.size) }}</p>
                        </div>
                    </div>

                    <!-- Remove Button -->
                    <UButton icon="i-lucide-x" size="xs" color="error" variant="solid"
                        class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        @click="removeFile(index)" />

                    <!-- Module-specific indicator -->
                    <div v-if="config.indicator"
                        class="absolute bottom-1 left-1 opacity-75 group-hover:opacity-100 transition-opacity">
                        <UIcon :name="config.indicator.icon" :class="config.indicator.class" />
                    </div>
                </div>
            </div>

            <!-- Module-specific tips -->
            <UAlert v-if="config.tips" color="info" variant="soft" icon="i-lucide-lightbulb" :title="config.tips.title">
                <template #description>
                    <div class="text-sm space-y-1">
                        <p v-for="tip in config.tips.items" :key="tip">• {{ tip }}</p>
                    </div>
                </template>
            </UAlert>
        </div>

        <!-- Error Messages -->
        <div v-if="errors.length > 0" class="space-y-2">
            <UAlert v-for="(error, index) in errors" :key="index" color="error" variant="soft" :title="error"
                class="text-sm" />
        </div>
    </div>
</template>

<script lang="ts" setup>
interface ImageUploadConfig {
    theme: 'primary' | 'pink' | 'orange'
    mainIcon: string
    buttonIcon: string
    buttonLabel: string
    title: string
    filesLabel: string
    indicator?: {
        icon: string
        class: string
    }
    tips?: {
        title: string
        items: string[]
    }
}

interface Props {
    modelValue: File[]
    maxFiles?: number
    maxFileSize?: number
    config: ImageUploadConfig
}

interface Emits {
    (e: 'update:modelValue', files: File[]): void
}

const props = withDefaults(defineProps<Props>(), {
    maxFiles: 200,
    maxFileSize: 10 * 1024 * 1024 // 10MB
})

const emit = defineEmits<Emits>()

// Use the generic image upload composable
const {
    selectedFiles,
    errors,
    isDragOver,
    removeFile,
    clearFiles,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    getFilePreview,
    formatFileSize,
    updateFiles,
    cleanup
} = useImageUpload({
    maxFiles: props.maxFiles,
    maxFileSize: props.maxFileSize,
    initialFiles: props.modelValue
})

// File input reference
const fileInput = ref<HTMLInputElement>()

// Theme-based drop zone classes
const dropZoneClasses = computed(() => {
    const themeClasses = {
        primary: 'border-primary-500 bg-primary-50 dark:bg-primary-900/20',
        pink: 'border-pink-500 bg-pink-50 dark:bg-pink-900/20',
        orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
    }

    return isDragOver.value ? themeClasses[props.config.theme] : ''
})

// Watch for external changes
watch(() => props.modelValue, (newFiles) => {
    updateFiles(newFiles)
})

// Emit changes when files are added/removed
watch(selectedFiles, (newFiles) => {
    emit('update:modelValue', [...newFiles])
})

// Cleanup on unmount
onUnmounted(() => {
    cleanup()
})
</script>