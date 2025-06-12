<template>
    <div>
        <!-- Floating Action Button -->
        <UDrawer v-model:open="isDrawerOpen">
            <UButton icon="i-lucide-plus" size="xl" color="neutral" variant="solid" :class="[
                'fixed bottom-6 right-6 z-40'
            ]" :disabled="disabled" :loading="disabled" />

            <template #content>
                <div class="p-6 space-y-6">
                    <!-- Upload Area -->
                    <div :class="[
                        'relative border-2 border-dashed rounded-xl p-8 transition-all duration-200',
                        'hover:border-primary-400 dark:hover:border-primary-500',
                        isDragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-neutral-300 dark:border-neutral-600',
                        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    ]" @click="!disabled && fileInput?.click()" @dragover.prevent="handleDragOver"
                        @dragenter.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
                        @drop.prevent="handleDrop">
                        <input ref="fileInput" type="file" multiple accept="image/*" class="hidden" :disabled="disabled"
                            @change="handleFileSelect">

                        <div class="text-center space-y-4">
                            <div :class="[
                                'mx-auto w-16 h-16 rounded-2xl flex items-center justify-center',
                                disabled ? 'bg-neutral-200 dark:bg-neutral-700' : 'bg-gradient-to-br from-primary-500 to-primary-600'
                            ]">
                                <UIcon :name="disabled ? 'i-lucide-loader-2' : 'i-lucide-upload'" :class="[
                                    'w-8 h-8',
                                    disabled ? 'text-neutral-500 animate-spin' : 'text-white'
                                ]" />
                            </div>

                            <div class="space-y-2">
                                <h4 class="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                                    {{ disabled ? "Upload en cours..." : "Glissez-déposez vos images" }}
                                </h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    {{ disabled ? `Progression: ${Math.round(progress)}%` :
                                        "ou cliquez pour sélectionner des fichiers" }}
                                </p>
                                <p v-if="!disabled" class="text-xs text-neutral-500">
                                    Formats supportés: JPG, PNG, WebP • Max 10MB par image
                                </p>
                            </div>
                        </div>

                        <!-- Progress bar -->
                        <div v-if="disabled && progress > 0" class="mt-6">
                            <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
                                <div class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300"
                                    :style="{ width: `${progress}%` }" />
                            </div>
                            <p class="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                                {{ Math.round(progress) }}% complété
                            </p>
                        </div>
                    </div>

                    <!-- Selected Files Preview -->
                    <div v-if="selectedFiles.length > 0" class="space-y-3">
                        <h4 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Fichiers sélectionnés ({{ selectedFiles.length }})
                        </h4>
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                            <div v-for="(file, index) in selectedFiles" :key="index"
                                class="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <div class="flex items-center space-x-2 min-w-0">
                                    <UIcon name="i-lucide-image" class="w-4 h-4 text-primary-500 flex-shrink-0" />
                                    <span class="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                                        {{ file.name }}
                                    </span>
                                </div>
                                <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost"
                                    :disabled="disabled" @click="removeFile(index)" />
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div
                        class="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <UButton label="Annuler" color="neutral" variant="ghost" @click="closeDrawer" />
                        <UButton
                            :label="selectedFiles.length > 0 ? `Ajouter ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''}` : 'Sélectionner des images'"
                            color="primary" :disabled="selectedFiles.length === 0 || disabled" @click="confirmUpload" />
                    </div>
                </div>
            </template>
        </UDrawer>
    </div>
</template>

<script setup lang="ts">
interface Props {
    disabled?: boolean
    progress?: number
}

interface Emits {
    'files-selected': [files: File[]]
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    progress: 0,
})

const emit = defineEmits<Emits>()

// Refs
const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const isDrawerOpen = ref(false)
const selectedFiles = ref<File[]>([])

// Drag and drop handlers
const handleDragOver = () => {
    if (!props.disabled) {
        isDragOver.value = true
    }
}

const handleDragLeave = () => {
    isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
    isDragOver.value = false
    if (props.disabled || !event.dataTransfer) return

    const files = Array.from(event.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
    )

    if (files.length > 0) {
        selectedFiles.value = files
    }
}

// File selection handler
const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (!target.files) return

    const files = Array.from(target.files)
    selectedFiles.value = files

    // Reset input
    target.value = ''
}

// File management
const removeFile = (index: number) => {
    selectedFiles.value.splice(index, 1)
}

// Drawer actions
const closeDrawer = () => {
    isDrawerOpen.value = false
    selectedFiles.value = []
}

const confirmUpload = () => {
    if (selectedFiles.value.length > 0) {
        emit('files-selected', selectedFiles.value)
        closeDrawer()
    }
}
</script>

<style scoped>
/* Additional styles if needed */
</style>