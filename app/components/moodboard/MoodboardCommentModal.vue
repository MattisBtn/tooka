<template>
    <UModal v-model:open="isOpen">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-message-circle" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold">Commentaires</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{ existingComments.length > 0
                            ? `${existingComments.length} commentaire${existingComments.length > 1 ? 's' : ''}`
                            : 'Aucun commentaire pour le moment' }}
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-4">
                <!-- Existing Comments -->
                <div v-if="existingComments.length > 0" class="space-y-3">
                    <h4 class="text-sm font-medium">Commentaires existants</h4>
                    <div class="space-y-3 max-h-64 overflow-y-auto">
                        <div v-for="comment in existingComments" :key="comment.id"
                            class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                            <p class="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                {{ comment.content }}
                            </p>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                {{ formatDate(comment.created_at) }}
                            </p>
                        </div>
                    </div>
                    <USeparator />
                </div>

                <!-- Add New Comment Form -->
                <div v-if="canAddComment" class="space-y-4">
                    <h4 class="text-sm font-medium">
                        {{ existingComments.length > 0 ? 'Ajouter un commentaire' : 'Premier commentaire' }}
                    </h4>

                    <UForm :schema="commentSchema" :state="formState" @submit="handleSubmit">
                        <UFormField name="content" label="Votre commentaire" required class="w-full">
                            <UTextarea v-model="formState.content" :rows="4" maxlength="500" class="w-full"
                                placeholder="Exprimez vos impressions, suggestions ou questions sur cette image..."
                                :disabled="isSubmitting" autofocus />
                        </UFormField>
                    </UForm>

                    <UAlert color="info" variant="soft" icon="i-lucide-lightbulb" title="Conseils">
                        <template #description>
                            <ul class="text-sm space-y-1">
                                <li>• Soyez spécifique dans vos retours</li>
                                <li>• Mentionnez ce qui vous plaît ou déplaît</li>
                                <li>• Proposez des alternatives si nécessaire</li>
                            </ul>
                        </template>
                    </UAlert>
                </div>

                <!-- Message when comments are disabled -->
                <div v-else class="text-center py-6">
                    <UIcon name="i-lucide-lock" class="w-8 h-8 text-neutral-400 mx-auto mb-3" />
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        Les commentaires ne sont plus autorisés sur ce moodboard
                    </p>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-between">
                <div v-if="canAddComment" class="text-xs text-neutral-500 dark:text-neutral-400">
                    {{ formState.content.length }}/500 caractères
                </div>
                <div class="flex items-center gap-3 ml-auto">
                    <UButton variant="ghost" color="neutral" :disabled="isSubmitting" @click="handleCancel">
                        Fermer
                    </UButton>
                    <UButton v-if="canAddComment" color="primary" icon="i-lucide-send" :loading="isSubmitting"
                        :disabled="!formState.content.trim()" @click="handleSubmit">
                        Publier
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { clientCommentSchema, type ClientCommentFormData, type MoodboardComment } from '~/types/moodboard'

interface Props {
    open: boolean
    existingComments: MoodboardComment[]
    canAddComment?: boolean
}

interface Emits {
    'update:open': [value: boolean]
    'comment-added': [content: string]
}

const props = withDefaults(defineProps<Props>(), {
    canAddComment: true
})
const emit = defineEmits<Emits>()

// Form state
const formState = reactive<ClientCommentFormData>({
    content: ''
})

const isSubmitting = ref(false)
const commentSchema = clientCommentSchema

// Computed
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

// Methods
const handleSubmit = async () => {
    if (!formState.content.trim() || isSubmitting.value || !props.canAddComment) return

    isSubmitting.value = true
    try {
        emit('comment-added', formState.content.trim())
        formState.content = ''
    } finally {
        isSubmitting.value = false
    }
}

const handleCancel = () => {
    formState.content = ''
    isOpen.value = false
}

// Date formatting
const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

// Reset form when modal closes
watch(isOpen, (newValue) => {
    if (!newValue) {
        formState.content = ''
    }
})
</script>

<style scoped>
/* Additional styles if needed */
</style>