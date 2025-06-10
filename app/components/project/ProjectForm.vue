<template>
    <UForm id="project-form" :schema="schema" :state="state" class="space-y-6" @submit="handleSubmit">
        <!-- Project Information -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-folder" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations du projet</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Détails principaux et identification du
                        projet
                    </p>
                </div>
            </div>

            <UFormField label="Titre du projet" name="title" required>
                <UInput v-model="state.title" placeholder="Ex: Shooting mariage Sarah & Thomas"
                    icon="i-heroicons-document-text" />
            </UFormField>

            <UFormField label="Client" name="client_id" required>
                <USelectMenu v-model="state.client_id" :items="clientOptions" value-key="value"
                    placeholder="Sélectionner un client existant" :loading="loadingClients" searchable
                    icon="i-heroicons-user-group" />
            </UFormField>

            <UFormField label="Description" name="description" class="w-full">
                <UTextarea v-model="state.description" autoresize
                    placeholder="Décrivez brièvement le projet, les attentes du client, le lieu, etc..." :rows="3"
                    class="w-full" />
            </UFormField>
        </div>

        <USeparator />

        <!-- Project Settings -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-currency-euro" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Tarification</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Prix initial et conditions financières</p>
                </div>
            </div>

            <UFormField label="Prix initial" name="initial_price" help="Montant de base avant options et suppléments">
                <UInput v-model="state.initial_price" type="number" placeholder="1500.00" step="0.01" min="0"
                    icon="i-heroicons-currency-euro">
                    <template #trailing>
                        <span class="text-neutral-500 dark:text-neutral-400 text-xs font-medium">€</span>
                    </template>
                </UInput>
            </UFormField>
        </div>

        <USeparator />

        <!-- Access Settings -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-link" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Accès client</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Paramètres de partage et d'accès sécurisé
                    </p>
                </div>
            </div>

            <UFormField label="Expiration du lien d'accès" name="password_expires_at"
                help="Date limite pour l'accès du client aux galeries">
                <UInput v-model="state.password_expires_at" type="datetime-local" icon="i-heroicons-calendar" />
            </UFormField>

            <!-- Info box about project status -->
            <UAlert color="info" variant="soft" icon="i-heroicons-information-circle" title="Statut du projet"
                description="Le projet sera créé en brouillon. Vous pourrez le faire passer en 'En cours' puis 'Terminé' depuis la liste des projets." />
        </div>

        <USeparator />

        <!-- Security Info -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-4">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sécurité</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Protection et accès sécurisé</p>
                </div>
            </div>

            <UAlert color="warning" variant="soft" icon="i-heroicons-key" title="Accès automatique"
                description="Un lien sécurisé et un mot de passe seront générés automatiquement pour permettre au client d'accéder à ses galeries en toute sécurité." />
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <UIcon name="i-heroicons-information-circle" class="w-4 h-4" />
                <span>Les champs marqués d'un <span class="text-red-500">*</span> sont obligatoires</span>
            </div>

            <div class="flex items-center gap-3">
                <UButton color="neutral" variant="ghost" label="Annuler" :disabled="isSubmitting"
                    @click="$emit('cancel')" />
                <UButton type="submit" color="primary" :loading="isSubmitting" :label="submitButtonLabel" />
            </div>
        </div>
    </UForm>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from "@nuxt/ui";
import { useProjectForm } from '~/composables/projects/useProjectForm';
import type { ProjectFormData, ProjectWithClient } from '~/types/project';

interface Props {
    project?: ProjectWithClient
}

interface Emits {
    (e: 'project-saved', project: ProjectWithClient): void
    (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
    state,
    schema,
    isEditMode,
    loadingClients,
    clientOptions,
    loadAllClients,
    onSubmit,
} = useProjectForm(props.project)

// Local loading state for better UX
const isSubmitting = ref(false)

const submitButtonLabel = computed(() =>
    isEditMode.value ? "Modifier le projet" : "Créer le projet"
)

// Handle form submission
const handleSubmit = async (event: FormSubmitEvent<ProjectFormData>) => {
    isSubmitting.value = true
    try {
        const result = await onSubmit(event.data)
        if (result) {
            emit('project-saved', result)
        }
    } finally {
        isSubmitting.value = false
    }
}

// Initialize form
onMounted(async () => {
    await loadAllClients()
})
</script>

<style scoped>
/* Add any custom styles here */
</style>