<template>
    <div class="space-y-4">
        <!-- File Input -->
        <div class="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6 text-center hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
            :class="{ 'border-orange-500 bg-orange-50 dark:bg-orange-900/20': isDragOver }"
            @dragover.prevent="isDragOver = true" @dragleave.prevent="isDragOver = false" @drop.prevent="handleDrop">

            <UIcon name="i-lucide-mouse-pointer-click" class="w-12 h-12 text-neutral-400 mx-auto mb-4" />

            <div class="space-y-2">
                <p class="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Glissez-déposez vos images de sélection ici
                </p>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    ou cliquez pour sélectionner des fichiers
                </p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                    Formats supportés: JPG, PNG, WebP • Max {{ maxFiles }} images • 10MB par image
                </p>
            </div>

            <input ref="fileInput" type="file" multiple accept="image/*" class="hidden" @change="handleFileSelect">

            <UButton icon="i-lucide-images" color="primary" variant="outline" label="Ajouter des images de sélection"
                class="mt-4" @click="fileInput?.click()" />
        </div>

        <!-- Selected Files Preview -->
        <div v-if="selectedFiles.length > 0" class="space-y-3">
            <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Images de sélection sélectionnées ({{ selectedFiles.length }})
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

                    <!-- Selection indicator -->
                    <div class="absolute bottom-1 left-1 opacity-75 group-hover:opacity-100 transition-opacity">
                        <UIcon name="i-lucide-mouse-pointer-click" class="w-4 h-4 text-orange-400 drop-shadow-sm" />
                    </div>
                </div>
            </div>

            <!-- Tips for selection images -->
            <UAlert color="info" variant="soft" icon="i-lucide-lightbulb" title="Conseils pour vos images de sélection">
                <template #description>
                    <div class="text-sm space-y-1">
                        <p>• Proposez plus d'images que le nombre maximum sélectionnable</p>
                        <p>• Variez les cadrages et les moments pour donner le choix au client</p>
                        <p>• Les images seront disponibles pour sélection par le client</p>
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
        return `${file.name}: Type de fichier non supporté (images uniquement)`
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
        newErrors.push(`Nombre maximum d'images dépassé (max ${props.maxFiles} pour une sélection)`)
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
            } else {
                newErrors.push(`${file.name}: Image déjà sélectionnée`)
            }
        }
    }

    // Update state
    errors.value = newErrors
    selectedFiles.value.push(...validFiles)
    emitUpdate()

    // Clear errors after a delay if files were successfully added
    if (validFiles.length > 0 && newErrors.length === 0) {
        setTimeout(() => {
            errors.value = []
        }, 3000)
    }
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
    errors.value = [] // Clear errors when manually removing files
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