<template>
    <div class="space-y-4">
        <!-- File Upload using UFileUpload -->
        <UFileUpload v-model="selectedFiles" multiple accept="image/*" :max="maxFiles" :max-size="maxFileSize"
            label="Glissez-déposez vos images d'inspiration ici"
            :description="`Formats supportés: JPG, PNG, WebP • Max ${maxFiles} images • ${maxFileSize / 1024 / 1024} MB par image`"
            icon="i-lucide-palette" color="primary" variant="area" size="lg" class="w-full min-h-48"
            @error="handleUploadError" />

        <!-- Selected Files Preview -->
        <div v-if="selectedFiles.length > 0" class="space-y-3">
            <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Images d'inspiration sélectionnées ({{ selectedFiles.length }})
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

                    <!-- Inspiration indicator -->
                    <div class="absolute bottom-1 left-1 opacity-75 group-hover:opacity-100 transition-opacity">
                        <UIcon name="i-lucide-lightbulb" class="w-4 h-4 text-yellow-400 drop-shadow-sm" />
                    </div>
                </div>
            </div>

            <!-- Tips for moodboard images -->
            <UAlert color="info" variant="soft" icon="i-lucide-lightbulb"
                title="Conseils pour vos images d'inspiration">
                <template #description>
                    <div class="text-sm space-y-1">
                        <p>• Choisissez des images qui représentent l'ambiance et le style souhaités</p>
                        <p>• Incluez des références de couleurs, lumière et composition</p>
                        <p>• Variez les sources : portraits, paysages, détails, textures</p>
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
interface Props {
    modelValue: File[]
    maxFiles?: number
    maxFileSize?: number // in bytes
}

interface Emits {
    (e: 'update:modelValue', files: File[]): void
}

const props = withDefaults(defineProps<Props>(), {
    maxFiles: 50,
    maxFileSize: 10 * 1024 * 1024 // 10MB
})

const emit = defineEmits<Emits>()

// Local state
const selectedFiles = ref<File[]>([...props.modelValue])
const errors = ref<string[]>([])

// Watch for external changes
watch(() => props.modelValue, (newFiles) => {
    selectedFiles.value = [...newFiles]
})

// Emit changes when files are added/removed
const emitUpdate = () => {
    emit('update:modelValue', [...selectedFiles.value])
}

// Watch selectedFiles for changes and emit updates
watch(selectedFiles, () => {
    emitUpdate()
}, { deep: true })

// Handle upload errors from UFileUpload
const handleUploadError = (error: { message?: string }) => {
    if (error.message) {
        errors.value = [error.message]
        // Clear errors after a delay
        setTimeout(() => {
            errors.value = []
        }, 3000)
    }
}

const removeFile = (index: number) => {
    selectedFiles.value.splice(index, 1)
    errors.value = [] // Clear errors when manually removing files
}

const clearFiles = () => {
    selectedFiles.value = []
    errors.value = []
}

// Utility methods
const getFilePreview = (file: File): string => {
    return URL.createObjectURL(file)
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Cleanup object URLs on unmount
onUnmounted(() => {
    selectedFiles.value.forEach(file => {
        URL.revokeObjectURL(getFilePreview(file))
    })
})
</script>