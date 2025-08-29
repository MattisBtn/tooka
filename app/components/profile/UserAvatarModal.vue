<template>
    <UModal v-model:open="isOpen" :ui="{ content: 'w-full max-w-md' }">
        <template #header>
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Photo de profil
                </h3>
                <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" square @click="closeModal" />
            </div>
        </template>

        <template #body>
            <!-- Current Avatar Preview -->
            <div class="flex flex-col items-center space-y-4">
                <div class="relative">
                    <UAvatar :src="displayAvatarUrl || undefined" :alt="avatarAlt" size="3xl"
                        class="ring-4 ring-neutral-200 dark:ring-neutral-700" />
                    <div v-if="isUploading"
                        class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-white animate-spin" />
                    </div>
                </div>

                <div class="text-center mb-4">
                    <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {{ avatarAlt }}
                    </p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Cliquez ou glissez une image pour la modifier
                    </p>
                </div>
            </div>

            <!-- File Upload Area -->
            <div class="space-y-4">
                <UFileUpload v-model="selectedFile" accept="image/*" :loading="isUploading" :disabled="isUploading"
                    variant="area" size="lg" class="w-full" :ui="{
                        base: 'min-h-32'
                    }">
                    <template #label>
                        <span class="font-medium">
                            {{ selectedFile ? 'Changer l\'image' : 'Choisir une image' }}
                        </span>
                    </template>
                    <template #description>
                        <span class="text-sm">
                            JPG, PNG ou WebP • Maximum 2MB • 50x50px à 2048x2048px
                        </span>
                    </template>
                </UFileUpload>

                <!-- Upload Error -->
                <UAlert v-if="error" color="error" variant="soft" :title="error" @close="resetError" />

                <!-- File Info -->
                <div v-if="selectedFile && !error" class="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div class="flex items-center gap-3">
                        <UIcon name="i-heroicons-document" class="w-5 h-5 text-neutral-500" />
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                {{ selectedFile.name }}
                            </p>
                            <p class="text-xs text-neutral-500">
                                {{ formatFileSize(selectedFile.size) }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-between w-full">
                <!-- Delete Button -->
                <UButton v-if="currentAvatarUrl && !selectedFile" color="error" variant="ghost" size="sm"
                    :loading="isUploading" :disabled="isUploading" @click="handleRemoveAvatar">
                    <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-1" />
                    Supprimer
                </UButton>

                <div v-else />

                <!-- Action Buttons -->
                <div class="flex items-center gap-2">
                    <UButton color="neutral" variant="ghost" :disabled="isUploading" @click="closeModal">
                        Annuler
                    </UButton>

                    <UButton v-if="selectedFile" color="primary" :loading="isUploading"
                        :disabled="isUploading || !!error" @click="handleUpload">
                        <UIcon name="i-heroicons-cloud-arrow-up" class="w-4 h-4 mr-1" />
                        Sauvegarder
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { useAvatarUpload } from '~/composables/user/useAvatarUpload';

interface Props {
    modelValue: boolean
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Modal state
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// Avatar upload composable
const {
    isUploading,
    error,
    displayAvatarUrl,
    currentAvatarUrl,
    avatarAlt,
    uploadAvatar,
    removeAvatar,
    resetState
} = useAvatarUpload()

// Local state
const selectedFile = ref<File | null>(null)

// Watch for file selection to reset errors
watch(selectedFile, () => {
    resetState()
})

// Handle upload
const handleUpload = async () => {
    if (!selectedFile.value) return

    const success = await uploadAvatar(selectedFile.value)

    if (success) {
        selectedFile.value = null
        closeModal()
    }
}

// Handle remove avatar
const handleRemoveAvatar = async () => {
    const success = await removeAvatar()

    if (success) {
        closeModal()
    }
}

// Close modal and reset state
const closeModal = () => {
    isOpen.value = false
    selectedFile.value = null
    resetState()
}

// Reset error
const resetError = () => {
    resetState()
}

// Format file size
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Watch modal state to reset when closed
watch(isOpen, (newValue) => {
    if (!newValue) {
        selectedFile.value = null
        resetState()
    }
})
</script>