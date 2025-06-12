<template>
    <div class="space-y-3">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div v-for="(image, index) in displayImages" :key="image.id"
                class="relative group aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden cursor-pointer"
                @click="$emit('image-click', image)">

                <!-- Image -->
                <img :src="getImageUrl(image.file_url)" :alt="image.caption || `Image d'inspiration ${index + 1}`"
                    class="w-full h-full object-cover" loading="lazy">

                <!-- Caption overlay if present -->
                <div v-if="image.caption"
                    class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p class="text-white text-xs font-medium truncate">{{ image.caption }}</p>
                </div>

                <!-- Inspiration indicator -->
                <div class="absolute top-2 left-2 opacity-75 group-hover:opacity-100 transition-opacity">
                    <UIcon name="i-lucide-lightbulb" class="w-4 h-4 text-yellow-400 drop-shadow-sm" />
                </div>

                <!-- Hover overlay with actions -->
                <div
                    class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div class="flex items-center gap-2">
                        <UButton icon="i-lucide-eye" size="xs" color="primary" variant="solid" title="Voir l'image"
                            @click.stop="$emit('image-click', image)" />

                        <UButton v-if="canEditCaption" icon="i-lucide-edit-3" size="xs" color="neutral" variant="solid"
                            title="Éditer la légende" @click.stop="openCaptionEditor(image)" />

                        <UButton v-if="canDelete" icon="i-lucide-trash-2" size="xs" color="error" variant="solid"
                            title="Supprimer" @click.stop="$emit('delete-image', image.id)" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Show more button if there are more images -->
        <div v-if="images.length > maxPreview" class="text-center">
            <UButton icon="i-lucide-plus" variant="outline" color="neutral"
                :label="`Voir ${images.length - maxPreview} image${images.length - maxPreview > 1 ? 's' : ''} d'inspiration de plus`"
                @click="showAll = !showAll" />
        </div>

        <!-- Caption Editor Modal -->
        <UModal v-model:open="captionModalOpen" :title="`Éditer la légende`">
            <template #body>
                <div class="space-y-4">
                    <div v-if="editingImage" class="flex flex-col items-center space-y-3">
                        <img :src="getImageUrl(editingImage.file_url)" :alt="editingImage.caption || 'Image'"
                            class="w-32 h-32 object-cover rounded-lg">
                        <UFormField label="Légende de l'image" name="caption">
                            <UTextarea v-model="editingCaption" :rows="3"
                                placeholder="Décrivez cette image d'inspiration : style, ambiance, couleurs..."
                                resize />
                        </UFormField>
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="flex items-center justify-end gap-3 w-full">
                    <UButton color="neutral" variant="ghost" label="Annuler" @click="cancelCaptionEdit" />
                    <UButton color="primary" label="Enregistrer" :loading="savingCaption" @click="saveCaptionEdit" />
                </div>
            </template>
        </UModal>
    </div>
</template>

<script lang="ts" setup>
import type { MoodboardImage } from '~/types/moodboard';

interface Props {
    images: MoodboardImage[]
    maxPreview?: number
    canDelete?: boolean
    canEditCaption?: boolean
}

interface Emits {
    (e: 'image-click', image: MoodboardImage): void
    (e: 'delete-image', imageId: string): void
    (e: 'update-caption', imageId: string, caption: string | null): void
}

const props = withDefaults(defineProps<Props>(), {
    maxPreview: 6,
    canDelete: false,
    canEditCaption: false
})

const emit = defineEmits<Emits>()

// Local state
const showAll = ref(false)
const captionModalOpen = ref(false)
const editingImage = ref<MoodboardImage | null>(null)
const editingCaption = ref('')
const savingCaption = ref(false)

const displayImages = computed(() => {
    if (showAll.value || props.images.length <= props.maxPreview) {
        return props.images
    }
    return props.images.slice(0, props.maxPreview)
})

// Get real image URL using the moodboard repository
const getImageUrl = (filePath: string) => {
    try {
        // Use the public URL method from Supabase directly for moodboard images
        const supabase = useSupabaseClient()
        const { data } = supabase.storage
            .from('moodboard-images')
            .getPublicUrl(filePath)
        return data.publicUrl
    } catch (error) {
        console.error('Error getting moodboard image URL:', error)
        return `https://via.placeholder.com/300x300?text=Error+Loading+Image`
    }
}

// Caption editing methods
const openCaptionEditor = (image: MoodboardImage) => {
    editingImage.value = image
    editingCaption.value = image.caption || ''
    captionModalOpen.value = true
}

const cancelCaptionEdit = () => {
    captionModalOpen.value = false
    editingImage.value = null
    editingCaption.value = ''
    savingCaption.value = false
}

const saveCaptionEdit = async () => {
    if (!editingImage.value) return

    savingCaption.value = true

    try {
        // Emit the update-caption event
        emit('update-caption', editingImage.value.id, editingCaption.value.trim() || null)

        // Close modal
        captionModalOpen.value = false
        editingImage.value = null
        editingCaption.value = ''
    } catch (error) {
        console.error('Error updating caption:', error)
    } finally {
        savingCaption.value = false
    }
}
</script>