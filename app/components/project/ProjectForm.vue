<template>
    <UForm id="project-form" :schema="schema" :state="state" class="space-y-6" @submit="handleSubmit">
        <!-- Project Information -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-folder" class="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations du projet</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Détails principaux et identification du
                        projet
                    </p>
                </div>
            </div>

            <UFormField label="Titre du projet" name="title" required>
                <UInput v-model="state.title" class="w-full" placeholder="Ex: Shooting mariage Sarah & Thomas"
                    icon="i-heroicons-document-text" />
            </UFormField>

            <UFormField label="Client" name="client_id" required>
                <div class="space-y-3">
                    <USelectMenu v-model="state.client_id" class="w-full" :items="clientOptions" value-key="value"
                        placeholder="Sélectionner un client existant" :loading="clientStore.loading" searchable
                        icon="i-heroicons-user-group" />

                    <UButton type="button" size="sm" icon="i-lucide-plus" label="Créer un nouveau client" block
                        @click="clientStore.openCreateModal" />
                </div>
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
                    class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-currency-euro" class="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Tarification</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Prix et conditions financières</p>
                </div>
            </div>

            <UFormField label="Prix" name="initial_price" help="Montant de base avant options et suppléments">
                <UInput v-model="state.initial_price" class="w-full" type="number" placeholder="1500.00" step="0.01"
                    min="0" icon="i-heroicons-currency-euro">
                    <template #trailing>
                        <span class="text-neutral-500 dark:text-neutral-400 text-xs font-medium">€</span>
                    </template>
                </UInput>
            </UFormField>
        </div>

        <USeparator />

        <!-- Security Settings -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sécurité</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Protection et accès sécurisé</p>
                </div>
            </div>

            <div class="space-y-4">
                <UFormField label="Mot de passe requis" name="require_password"
                    help="Définir si un mot de passe est nécessaire pour accéder aux galeries">
                    <USwitch v-model="state.require_password" />
                </UFormField>

                <UAlert :color="state.require_password ? 'warning' : 'info'" variant="soft"
                    :icon="state.require_password ? 'i-heroicons-key' : 'i-heroicons-information-circle'"
                    :title="state.require_password ? 'Accès protégé' : 'Accès libre'"
                    :description="state.require_password ? 'Un mot de passe sera généré automatiquement pour protéger l\'accès aux galeries.' : 'Le client pourra accéder aux galeries sans mot de passe.'" />
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <UButton color="neutral" variant="ghost" label="Annuler" :disabled="isSubmitting" @click="handleCancel" />
            <UButton type="submit" color="primary" :loading="isSubmitting" :label="submitButtonLabel" />
        </div>
    </UForm>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from "@nuxt/ui";
import type { ProjectFormData, ProjectWithClient } from '~/types/project';
import { projectFormSchema } from '~/types/project';

interface Props {
    project?: ProjectWithClient
}

interface Emits {
    (e: 'cancel'): void;
}


const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Stores
const store = useProjectsStore()
const clientStore = useClientsStore()

// Client options from store
const clientOptions = computed(() =>
    clientStore.clients.map((client) => ({
        value: client.id,
        label: client.type === "individual"
            ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
            : client.company_name || "",
    }))
)

// Initialize clients when component mounts
onMounted(async () => {
    if (clientStore.clients.length === 0) {
        await clientStore.initialize()
    }
})

watch(() => clientStore.modalState.type, async (newType, oldType) => {
    if ((oldType === 'create' || oldType === 'edit') && newType === null) {
        await clientStore.refresh()
    }
})

// Form state
const state = reactive<ProjectFormData>({
    title: props.project?.title || '',
    description: props.project?.description || '',
    client_id: props.project?.client_id || '',
    status: props.project?.status || 'draft',
    initial_price: props.project?.initial_price || null,
    require_password: props.project?.password_hash ? true : false
})

// Schema from types
const schema = projectFormSchema

// Local loading state
const isSubmitting = ref(false)

// Computed
const isEditMode = computed(() => !!props.project)

const submitButtonLabel = computed(() =>
    isEditMode.value ? "Modifier le projet" : "Créer le projet"
)

// Methods
const handleSubmit = async (event: FormSubmitEvent<ProjectFormData>) => {
    isSubmitting.value = true
    try {
        if (isEditMode.value && props.project) {
            await store.updateProject(props.project.id, event.data)
        } else {
            await store.createProject(event.data)
        }


    } finally {
        isSubmitting.value = false
        store.closeModal()
    }
}

const handleCancel = () => {
    emit('cancel')
    store.closeModal()
}
</script>