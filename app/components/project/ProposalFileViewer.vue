<template>
    <div v-if="filePath" class="space-y-3">
        <!-- File Display -->
        <div
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3 min-w-0 flex-1">
                <!-- File Icon -->
                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    :class="getFileTypeColor()">
                    <UIcon :name="getFileTypeIcon()" class="w-5 h-5 text-white" />
                </div>

                <!-- File Info -->
                <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {{ displayName }}
                    </p>
                    <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{{ fileTypeLabel }}</span>
                        <span v-if="showPath">•</span>
                        <span v-if="showPath" class="truncate">{{ filePath }}</span>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
                <UTooltip text="Ouvrir le fichier">
                    <UButton icon="i-lucide-external-link" size="xs" variant="ghost" color="primary"
                        :loading="fileLoading" :disabled="fileLoading" @click="handleOpenFile" />
                </UTooltip>

                <UTooltip text="Télécharger">
                    <UButton icon="i-lucide-download" size="xs" variant="ghost" color="neutral" :loading="fileLoading"
                        :disabled="fileLoading" @click="handleDownloadFile" />
                </UTooltip>

                <UTooltip v-if="allowDelete" text="Supprimer le fichier">
                    <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error" :loading="fileLoading"
                        :disabled="fileLoading" @click="handleDeleteFile" />
                </UTooltip>
            </div>
        </div>

        <!-- Error Display -->
        <UAlert v-if="fileError" color="error" variant="soft" icon="i-lucide-alert-circle"
            :title="fileError.message || 'Erreur inconnue'" class="text-sm" />
    </div>
</template>

<script lang="ts" setup>
import { useProposalFiles } from '~/composables/proposals/useProposalFiles'

interface Props {
    filePath: string
    displayName?: string
    allowDelete?: boolean
    showPath?: boolean
}

interface Emits {
    (e: 'file-deleted'): void
    (e: 'error', error: string): void
}

const props = withDefaults(defineProps<Props>(), {
    allowDelete: false,
    showPath: false
})

const emit = defineEmits<Emits>()

const {
    loading: fileLoading,
    error: fileError,
    openFile,
    downloadFile,
    deleteFile,
    getFileType,
    getFileDisplayName,
    extractFilenameFromPath
} = useProposalFiles()

// Computed properties
const displayName = computed(() => {
    return props.displayName || getFileDisplayName(props.filePath)
})

const fileType = computed(() => getFileType(props.filePath))

const fileTypeLabel = computed(() => {
    switch (fileType.value) {
        case 'contract':
            return 'Contrat'
        case 'quote':
            return 'Devis'
        default:
            return 'Document'
    }
})

// File type styling
const getFileTypeIcon = (): string => {
    switch (fileType.value) {
        case 'contract':
            return 'i-lucide-file-text'
        case 'quote':
            return 'i-lucide-file-text'
        default:
            return 'i-lucide-file'
    }
}

const getFileTypeColor = (): string => {
    switch (fileType.value) {
        case 'contract':
            return 'bg-blue-500'
        case 'quote':
            return 'bg-green-500'
        default:
            return 'bg-gray-500'
    }
}

// Actions
const handleOpenFile = async () => {
    try {
        await openFile(props.filePath)
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ouverture du fichier'
        emit('error', errorMessage)
    }
}

const handleDownloadFile = async () => {
    try {
        const filename = extractFilenameFromPath(props.filePath)
        await downloadFile(props.filePath, filename)
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du téléchargement'
        emit('error', errorMessage)
    }
}

const handleDeleteFile = async () => {
    if (!props.allowDelete) return

    try {
        await deleteFile(props.filePath)
        emit('file-deleted')
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression'
        emit('error', errorMessage)
    }
}
</script>