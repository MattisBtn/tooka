<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import { useAuth } from '~/composables/auth/useAuth'
import { feedbackService } from '~/services/feedbackService'
import type { FeedbackFormData } from '~/types/feedback'
import { feedbackFormSchema } from '~/types/feedback'

const { createFeedback } = feedbackService
const { user } = useAuth()

interface Props {
    modelValue: boolean
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isSubmitting = ref(false)
const showSuccess = ref(false)

// Form state
const state = reactive<FeedbackFormData>({
    title: '',
    description: '',
    type: 'bug'
})

// Computed properties
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => {
        emit('update:modelValue', value)
        // Reset form when modal closes
        if (!value) {
            resetForm()
        }
    }
})

const modalTitle = computed(() => 'Soumettre un feedback')

const feedbackTypes = [
    { label: 'Bug', value: 'bug', icon: 'i-heroicons-exclamation-triangle' },
    { label: 'Nouvelle fonctionnalité', value: 'feature', icon: 'i-heroicons-light-bulb' },
    { label: 'Question', value: 'question', icon: 'i-heroicons-question-mark-circle' },
    { label: 'Autre', value: 'other', icon: 'i-heroicons-chat-bubble-left-right' }
]

// Reset form function
const resetForm = () => {
    Object.assign(state, {
        title: '',
        description: '',
        type: 'bug'
    })
    isSubmitting.value = false
    showSuccess.value = false
}

const handleSubmit = async (event: FormSubmitEvent<FeedbackFormData>) => {
    if (!user.value?.id) {
        throw createError('Utilisateur non connecté')
    }

    // Prevent multiple submissions
    if (isSubmitting.value) {
        return
    }

    isSubmitting.value = true

    try {
        const feedbackData = {
            ...event.data,
            user_id: user.value.id
        }

        const result = await createFeedback(feedbackData)
        if (result) {
            showSuccess.value = true
            // Reset form data (keep submitting state)
            Object.assign(state, {
                title: '',
                description: '',
                type: 'bug'
            })

            // Hide success message and close modal after 3 seconds
            setTimeout(() => {
                showSuccess.value = false
                isOpen.value = false
            }, 3000)
        }
    } catch (error) {
        console.error('Error submitting feedback:', error)
        // Reset submitting state on error to allow retry
        isSubmitting.value = false
    }
    // Don't reset isSubmitting on success - keep it true until modal closes
}

const handleCancel = () => {
    // Prevent closing if submitting
    if (isSubmitting.value) {
        return
    }
    isOpen.value = false
}

// Handle escape key
onKeyStroke('Escape', (e) => {
    if (isOpen.value && !isSubmitting.value) {
        e.preventDefault()
        isOpen.value = false
    }
})

// Reset form when modal opens
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        resetForm()
    }
})
</script>

<template>
    <UModal v-model:open="isOpen" :title="modalTitle" :close="{ color: 'neutral', variant: 'ghost' }"
        :ui="{ content: 'sm:max-w-xl' }" :close-button="{ disabled: isSubmitting }">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <UIcon name="i-heroicons-chat-bubble-left-right" class="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-highlighted">{{ modalTitle }}</h3>
                    <p class="text-sm text-muted">
                        Partagez votre retour, suggestion ou signalement de bug
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <UAlert v-if="showSuccess" title="Feedback envoyé !"
                description="Merci pour votre retour. Nous l'examinerons dans les plus brefs délais."
                icon="i-heroicons-check-circle" color="success" class="mb-4" />

            <UForm id="feedback-form" :schema="feedbackFormSchema" :state="state" class="space-y-6"
                @submit="handleSubmit">
                <UFormField label="Type de feedback" name="type" required
                    help="Choisissez la catégorie qui correspond le mieux à votre retour">
                    <USelectMenu v-model="state.type" :items="feedbackTypes" value-key="value"
                        placeholder="Choisir un type" class="w-full" :disabled="isSubmitting" required />
                </UFormField>

                <UFormField label="Titre" name="title" required
                    help="Un titre court et descriptif pour identifier rapidement votre feedback">
                    <UInput v-model="state.title" class="w-full" placeholder="Titre court et descriptif"
                        :disabled="isSubmitting" required :maxlength="255" />
                </UFormField>

                <UFormField label="Description" name="description" required
                    help="Décrivez en détail votre problème, suggestion ou question pour nous aider à mieux comprendre">
                    <UTextarea v-model="state.description" class="w-full" :autoresize="true" :maxlength="2000"
                        placeholder="Décrivez votre problème, suggestion ou question en détail..." :rows="6"
                        :disabled="isSubmitting" required />
                </UFormField>

                <!-- Boutons -->
                <div class="flex justify-between">
                    <UButton type="button" color="neutral" variant="ghost" :disabled="isSubmitting"
                        @click="handleCancel">
                        Annuler
                    </UButton>
                    <UButton type="submit" icon="i-heroicons-paper-airplane" color="primary" :loading="isSubmitting"
                        :disabled="!state.title || !state.description || isSubmitting">
                        {{ isSubmitting ? 'Envoi en cours...' : 'Envoyer le feedback' }}
                    </UButton>
                </div>
            </UForm>
        </template>
    </UModal>
</template>
