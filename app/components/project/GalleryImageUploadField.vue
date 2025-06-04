<template>
    <div class="space-y-4">
        <!-- File Input -->
        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-900/20': isDragOver }"
            @dragover.prevent="isDragOver = true" @dragleave.prevent="isDragOver = false" @drop.prevent="handleDrop">

            <UIcon name="i-lucide-upload-cloud" class="w-12 h-12 text-gray-400 mx-auto mb-4" />

            <div class="space-y-2">
                <p class="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Glissez-déposez vos images ici
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    ou cliquez pour sélectionner des fichiers
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    Formats supportés: JPG, PNG, WebP • Max {{ maxFiles }} images • 10MB par image
                </p>
            </div>

            <input ref="fileInput" type="file" multiple accept="image/*" class="hidden" @change="handleFileSelect">

            <UButton icon="i-lucide-folder-open" color="primary" variant="outline" label="Sélectionner des images"
                class="mt-4" @click="fileInput?.click()" />
        </div>

        <!-- Selected Files Preview -->
        <div v-if="selectedFiles.length > 0" class="space-y-3">
            <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Images sélectionnées ({{ selectedFiles.length }})
                </h4>
                <UButton icon="i-lucide-x" size="xs" variant="ghost" color="error" label="Tout supprimer"
                    @click="clearFiles" />
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div v-for="(file, index) in selectedFiles" :key="index"
                    class="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">

                    <!-- Image Preview -->
                    <img :src="getFilePreview(file)" :alt="file.name" class="w-full h-full object-cover">

                    <!-- File Info Overlay -->
                    <div
                        class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div class="text-center text-white text-xs p-2">
                            <p class="font-medium truncate">{{ file.name }}</p>
                            <p>{{ formatFileSize(file.size) }}</p>
                        </div>
                    </div>

                    <!-- Remove Button -->
                    <UButton icon="i-lucide-x" size="xs" color="error" variant="solid"
                        class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        @click="removeFile(index)" />
                </div>
            </div>
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
    maxFiles: 200,
    maxFileSize: 10 * 1024 * 1024 // 10MB
})

const emit = defineEmits<Emits>()

// Local state
const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)
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

// File handling methods
const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
        return `${file.name}: Type de fichier non supporté`
    }

    if (file.size > props.maxFileSize) {
        return `${file.name}: Fichier trop volumineux (max ${formatFileSize(props.maxFileSize)})`
    }

    return null
}

const addFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newErrors: string[] = []
    const validFiles: File[] = []

    // Check total file count
    if (selectedFiles.value.length + fileArray.length > props.maxFiles) {
        newErrors.push(`Nombre maximum de fichiers dépassé (max ${props.maxFiles})`)
        return
    }

    // Validate each file
    for (const file of fileArray) {
        const error = validateFile(file)
        if (error) {
            newErrors.push(error)
        } else {
            // Check for duplicates
            const isDuplicate = selectedFiles.value.some(
                existingFile => existingFile.name === file.name && existingFile.size === file.size
            )
            if (!isDuplicate) {
                validFiles.push(file)
            }
        }
    }

    // Update state
    errors.value = newErrors
    selectedFiles.value.push(...validFiles)
    emitUpdate()
}

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files) {
        addFiles(target.files)
        target.value = '' // Reset input
    }
}

const handleDrop = (event: DragEvent) => {
    isDragOver.value = false
    if (event.dataTransfer?.files) {
        addFiles(event.dataTransfer.files)
    }
}

const removeFile = (index: number) => {
    selectedFiles.value.splice(index, 1)
    emitUpdate()
}

const clearFiles = () => {
    selectedFiles.value = []
    errors.value = []
    emitUpdate()
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