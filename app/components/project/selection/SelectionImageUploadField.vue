<template>
    <div class="space-y-4">
        <!-- File Upload using UFileUpload -->
        <UFileUpload v-model="selectedFiles" multiple :accept="selectionUploadRules.accept" :max="maxFiles"
            :max-size="maxFileSize" label="Glissez-déposez vos images de sélection ici"
            :description="selectionUploadRules.description" icon="i-lucide-images" color="primary" variant="area"
            size="lg" class="w-full min-h-48" layout="list" @error="handleUploadError" />

        <!-- Error Messages -->
        <div v-if="errors.length > 0" class="space-y-2">
            <UAlert v-for="(error, index) in errors" :key="index" color="error" variant="soft" :title="error"
                class="text-sm" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useUploadRules } from '~/composables/shared/useUploadRules'

interface Props {
    modelValue: File[]
    maxFiles?: number
    maxFileSize?: number // in bytes
}

interface Emits {
    (e: 'update:modelValue', files: File[]): void
}

const props = withDefaults(defineProps<Props>(), {
    maxFiles: undefined, // Will use config default
    maxFileSize: undefined // Will use config default
})

const emit = defineEmits<Emits>()

// Get upload rules after props are defined
const { selectionUploadRules } = useUploadRules()

// Use computed to get the actual values with fallbacks from config
const maxFiles = computed(() => props.maxFiles ?? selectionUploadRules.maxFiles)
const maxFileSize = computed(() => props.maxFileSize ?? selectionUploadRules.maxFileSize)

// Local state - use computed to avoid recursive updates
const selectedFiles = computed({
    get: () => [...props.modelValue],
    set: (files: File[]) => {
        emit('update:modelValue', [...files])
    }
})

const errors = ref<string[]>([])

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
</script>