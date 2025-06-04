<template>
    <div class="space-y-3">
        <!-- Hidden file input - always present -->
        <input ref="fileInput" type="file" class="hidden" :accept="accept" :disabled="disabled"
            @change="handleFileSelect">

        <!-- Upload Area -->
        <div v-if="!hasFile" ref="dropZone"
            class="relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer group" :class="[
                isDragOver
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-950 dark:border-primary-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700',
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            ]" @click="!disabled && fileInput?.click()" @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">

            <div class="flex flex-col items-center justify-center p-6 text-center">
                <!-- Icon -->
                <div class="w-12 h-12 mb-4 rounded-full flex items-center justify-center transition-colors" :class="isDragOver
                    ? 'bg-primary-100 dark:bg-primary-900'
                    : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-950'">
                    <UIcon :name="isDragOver ? 'i-lucide-download' : 'i-lucide-upload'"
                        class="w-6 h-6 transition-colors" :class="isDragOver
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-500'" />
                </div>

                <!-- Text -->
                <div class="space-y-2">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {{ isDragOver ? 'Déposez votre fichier ici' :
                            'Glissez-déposez votre fichier ou cliquez pour sélectionner' }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ acceptText }} • Max {{ maxSizeText }}
                    </p>
                </div>

                <!-- Upload Button -->
                <UButton v-if="!isDragOver" size="sm" variant="outline" color="primary" class="mt-4"
                    :disabled="disabled">
                    Choisir un fichier
                </UButton>
            </div>
        </div>

        <!-- File Preview -->
        <div v-else
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3 min-w-0 flex-1">
                <!-- File Icon -->
                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    :class="getFileTypeColor(file || undefined)">
                    <UIcon :name="getFileTypeIcon(file || undefined)" class="w-5 h-5 text-white" />
                </div>

                <!-- File Info -->
                <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {{ file?.name }}
                    </p>
                    <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{{ formatFileSize(file || undefined) }}</span>
                        <span>•</span>
                        <span>{{ getFileTypeLabel(file || undefined) }}</span>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
                <UTooltip text="Remplacer le fichier">
                    <UButton icon="i-lucide-edit" size="xs" variant="ghost" color="neutral" :disabled="disabled"
                        @click="fileInput?.click()" />
                </UTooltip>
                <UTooltip text="Supprimer le fichier">
                    <UButton icon="i-lucide-x" size="xs" variant="ghost" color="error" :disabled="disabled"
                        @click="removeFile" />
                </UTooltip>
            </div>
        </div>

        <!-- Error Message -->
        <UAlert v-if="error" color="error" variant="soft" icon="i-lucide-alert-circle" :title="error" class="text-sm" />

        <!-- Help Text -->
        <p v-if="helpText && !error" class="text-xs text-gray-500 dark:text-gray-400">
            {{ helpText }}
        </p>
    </div>
</template>

<script lang="ts" setup>
// Interface for existing file info
interface ExistingFileInfo {
    name: string;
    path: string;
    isExisting: true;
}

interface Props {
    modelValue?: File | ExistingFileInfo | null
    accept?: string
    maxSize?: number // in bytes
    disabled?: boolean
    helpText?: string
    placeholder?: string
}

interface Emits {
    (e: 'update:modelValue' | 'change', file: File | ExistingFileInfo | null): void
    (e: 'error', error: string): void
}

const props = withDefaults(defineProps<Props>(), {
    accept: '*/*',
    maxSize: 50 * 1024 * 1024, // 50MB default
    disabled: false
})

const emit = defineEmits<Emits>()

// Refs
const fileInput = ref<HTMLInputElement>()
const dropZone = ref<HTMLElement>()

// State
const isDragOver = ref(false)
const error = ref<string>('')

// Computed
const file = computed(() => props.modelValue)
const hasFile = computed(() => !!file.value)

const acceptText = computed(() => {
    if (!props.accept || props.accept === '*/*') return 'Tous les fichiers'

    const types = props.accept.split(',').map(type => type.trim())
    const extensions = types
        .filter(type => type.startsWith('.'))
        .map(type => type.toUpperCase())

    if (extensions.length > 0) {
        return extensions.join(', ')
    }

    // Handle MIME types
    const mimeTypes = types.filter(type => !type.startsWith('.'))
    if (mimeTypes.includes('image/*')) return 'Images'
    if (mimeTypes.includes('application/pdf')) return 'PDF'
    if (mimeTypes.some(type => type.includes('document'))) return 'Documents'

    return 'Fichiers autorisés'
})

const maxSizeText = computed(() => {
    const size = props.maxSize
    if (size >= 1024 * 1024) {
        return `${Math.round(size / (1024 * 1024))}MB`
    }
    if (size >= 1024) {
        return `${Math.round(size / 1024)}KB`
    }
    return `${size}B`
})

// Methods
const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > props.maxSize) {
        return `Le fichier est trop volumineux. Taille maximum : ${maxSizeText.value}`
    }

    // Check file type
    if (props.accept && props.accept !== '*/*') {
        const acceptedTypes = props.accept.split(',').map(type => type.trim())
        const isAccepted = acceptedTypes.some(type => {
            if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type.toLowerCase())
            }
            return file.type.match(type.replace('*', '.*'))
        })

        if (!isAccepted) {
            return `Type de fichier non autorisé. Types acceptés : ${acceptText.value}`
        }
    }

    return null
}

const setFile = (newFile: File | ExistingFileInfo | null) => {
    error.value = ''

    if (newFile && 'size' in newFile) { // It's a File object
        const validationError = validateFile(newFile)
        if (validationError) {
            error.value = validationError
            emit('error', validationError)
            return
        }
    }

    emit('update:modelValue', newFile)
    emit('change', newFile)
}

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const selectedFile = target.files?.[0] || null
    setFile(selectedFile)

    // Reset input value to allow selecting the same file again
    target.value = ''
}

const handleDragOver = (event: DragEvent) => {
    if (props.disabled) return
    event.preventDefault()
    isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
    if (props.disabled) return
    event.preventDefault()

    // Only set to false if we're leaving the drop zone entirely
    const rect = dropZone.value?.getBoundingClientRect()
    if (rect) {
        const x = event.clientX
        const y = event.clientY
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            isDragOver.value = false
        }
    }
}

const handleDrop = (event: DragEvent) => {
    if (props.disabled) return
    event.preventDefault()
    isDragOver.value = false

    const droppedFile = event.dataTransfer?.files[0] || null
    setFile(droppedFile)
}

const removeFile = () => {
    setFile(null)
}

// File type utilities
const getFileTypeIcon = (file?: File | ExistingFileInfo): string => {
    if (!file) return 'i-lucide-file'

    const fileName = file.name
    if ('type' in file) {
        // It's a File object
        const mimeType = file.type
        if (mimeType.startsWith('image/')) return 'i-lucide-image'
        if (mimeType === 'application/pdf') return 'i-lucide-file-text'
        if (mimeType.includes('document') || mimeType.includes('word')) return 'i-lucide-file-text'
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'i-lucide-file-spreadsheet'
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'i-lucide-presentation'
        if (mimeType.startsWith('video/')) return 'i-lucide-video'
        if (mimeType.startsWith('audio/')) return 'i-lucide-music'
        if (mimeType.includes('zip') || mimeType.includes('archive')) return 'i-lucide-archive'
    } else {
        // It's an ExistingFileInfo, determine type from filename
        if (fileName.toLowerCase().includes('contract')) return 'i-lucide-file-text'
        if (fileName.toLowerCase().includes('quote')) return 'i-lucide-file-text'
        if (fileName.toLowerCase().endsWith('.pdf')) return 'i-lucide-file-text'
        if (fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'i-lucide-image'
    }

    return 'i-lucide-file'
}

const getFileTypeColor = (file?: File | ExistingFileInfo): string => {
    if (!file) return 'bg-gray-500'

    if ('type' in file) {
        // It's a File object
        const mimeType = file.type
        if (mimeType.startsWith('image/')) return 'bg-green-500'
        if (mimeType === 'application/pdf') return 'bg-red-500'
        if (mimeType.includes('document') || mimeType.includes('word')) return 'bg-blue-500'
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'bg-emerald-500'
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'bg-orange-500'
        if (mimeType.startsWith('video/')) return 'bg-purple-500'
        if (mimeType.startsWith('audio/')) return 'bg-pink-500'
        if (mimeType.includes('zip') || mimeType.includes('archive')) return 'bg-yellow-500'
    } else {
        // It's an ExistingFileInfo
        const fileName = file.name.toLowerCase()
        if (fileName.includes('contract')) return 'bg-blue-500'
        if (fileName.includes('quote')) return 'bg-green-500'
        if (fileName.endsWith('.pdf')) return 'bg-red-500'
        if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'bg-green-500'
    }

    return 'bg-gray-500'
}

const getFileTypeLabel = (file?: File | ExistingFileInfo): string => {
    if (!file) return 'Fichier'

    if ('type' in file) {
        // It's a File object
        const mimeType = file.type
        if (mimeType.startsWith('image/')) return 'Image'
        if (mimeType === 'application/pdf') return 'PDF'
        if (mimeType.includes('document') || mimeType.includes('word')) return 'Document'
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Tableur'
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Présentation'
        if (mimeType.startsWith('video/')) return 'Vidéo'
        if (mimeType.startsWith('audio/')) return 'Audio'
        if (mimeType.includes('zip') || mimeType.includes('archive')) return 'Archive'
    } else {
        // It's an ExistingFileInfo
        const fileName = file.name.toLowerCase()
        if (fileName.includes('contract')) return 'Contrat'
        if (fileName.includes('quote')) return 'Devis'
        if (fileName.endsWith('.pdf')) return 'PDF'
        if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'Image'
    }

    return 'Fichier'
}

const formatFileSize = (file?: File | ExistingFileInfo): string => {
    if (!file || !('size' in file)) return 'Taille inconnue'

    const bytes = file.size
    if (!bytes) return '0 B'

    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
}

// Cleanup
onUnmounted(() => {
    error.value = ''
})
</script>