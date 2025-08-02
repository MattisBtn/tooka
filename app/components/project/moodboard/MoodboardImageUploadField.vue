<template>
    <div class="space-y-4">
        <!-- File Upload using UFileUpload -->
        <UFileUpload v-model="selectedFiles" multiple accept="image/jpeg, image/png, image/webp" :max="maxFiles"
            :max-size="maxFileSize" label="Glissez-déposez vos images d'inspiration ici"
            :description="`Formats supportés: JPG, PNG, WebP • Max ${maxFiles} images • ${maxFileSize / 1024 / 1024} MB par image`"
            icon="i-lucide-palette" color="primary" variant="area" size="lg" class="w-full min-h-48" layout="list"
            @error="handleUploadError" />

        <!-- Selected Files Preview -->
        <div v-if="selectedFiles.length > 0" class="space-y-3">
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
    maxFileSize: 100 * 1024 * 1024 // 10MB
})

const emit = defineEmits<Emits>()

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