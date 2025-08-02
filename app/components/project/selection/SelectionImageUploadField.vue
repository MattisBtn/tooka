<template>
    <div class="space-y-4">
        <!-- File Upload using UFileUpload -->
        <UFileUpload v-model="selectedFiles" multiple
            accept="image/*,.nef,.dng,.raw,.cr2,.arw,.raf,.orf,.rw2,.crw,.pef,.srw,.x3f" :max="maxFiles"
            :max-size="maxFileSize" label="Glissez-déposez vos images de sélection ici"
            :description="`Formats supportés: JPG, PNG, WebP, ARW, CR2, DNG, NEF, RAW • Max ${maxFiles} images • ${maxFileSize / 1024 / 1024} MB par image`"
            icon="i-lucide-images" color="primary" variant="area" size="lg" class="w-full min-h-48" layout="list"
            @error="handleUploadError" />

        <!-- Selected Files Preview -->
        <div v-if="selectedFiles.length > 0" class="space-y-3">
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
    maxFileSize: 100 * 1024 * 1024 // 100MB
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