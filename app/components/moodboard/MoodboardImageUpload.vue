<template>
    <div>
        <!-- Floating Action Button -->
        <UDrawer v-model:open="isDrawerOpen">
            <UButton icon="i-lucide-plus" size="xl" color="neutral" variant="solid" :class="[
                'fixed bottom-6 right-6 z-40'
            ]" :disabled="disabled" :loading="disabled" />

            <template #content>
                <div class="p-6 space-y-6">
                    <!-- Upload Area using UFileUpload -->
                    <UFileUpload v-model="selectedFiles" multiple :accept="imageUploadRules.accept"
                        :max="imageUploadRules.maxFiles" :max-size="imageUploadRules.maxFileSize"
                        label="Glissez-déposez vos images ici" :description="imageUploadRules.description"
                        icon="i-lucide-upload" color="primary" variant="area" size="lg" class="w-full min-h-48"
                        layout="list" :disabled="disabled" @error="handleUploadError" />

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
import { useUploadRules } from '~/composables/shared/useUploadRules';

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

// Expose props for template usage
const { disabled } = toRefs(props)

const emit = defineEmits<Emits>()

const { imageUploadRules } = useUploadRules()

// Refs
const isDrawerOpen = ref(false)
const selectedFiles = ref<File[]>([])

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

// Handle upload errors
const handleUploadError = (error: { message?: string }) => {
    console.error('Upload error:', error.message)
}
</script>

<style scoped>
/* Additional styles if needed */
</style>