<template>
    <UCard variant="subtle">
        <template #header>
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <UIcon name="i-lucide-info" class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Résumé du projet</h2>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">Informations principales et état
                            actuel</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <UBadge :color="(statusInfo?.color as any) || 'gray'" variant="subtle"
                        :label="statusInfo?.label || project.status" :icon="statusInfo?.icon" />

                    <!-- Edit Button -->
                    <UButton v-if="canEditProject" icon="i-lucide-edit" size="sm" color="primary" variant="ghost"
                        :loading="isEditing" :disabled="isEditing" title="Modifier le projet" @click="startEditing" />

                    <!-- Edit Locked Alert -->
                    <UTooltip v-else
                        text="Le projet ne peut pas être modifié car certaines étapes ne sont plus en brouillon"
                        :content="{ side: 'top' }">
                        <UButton icon="i-lucide-lock" size="sm" color="neutral" variant="ghost" disabled
                            title="Modification verrouillée" />
                    </UTooltip>
                </div>
            </div>
        </template>

        <!-- Edit Mode -->
        <div v-if="isEditing" class="space-y-6">
            <UForm id="project-edit-form" :schema="editSchema" :state="editState" class="space-y-6"
                @submit="handleEditSubmit">
                <!-- Project Information Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-folder" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations du
                                projet</h2>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Modifiez les détails principaux du
                                projet
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UFormField label="Titre du projet" name="title" required>
                            <UInput v-model="editState.title" placeholder="Ex: Shooting mariage Sarah & Thomas"
                                icon="i-heroicons-document-text" />
                        </UFormField>

                        <UFormField label="Client" name="client_id" required>
                            <USelectMenu v-model="editState.client_id" :items="clientOptions" value-key="value"
                                placeholder="Sélectionner un client" :loading="loadingClients" searchable
                                icon="i-heroicons-user-group" />
                        </UFormField>
                    </div>

                    <UFormField label="Description" name="description">
                        <UTextarea v-model="editState.description"
                            placeholder="Décrivez brièvement le projet, les attentes du client, le lieu, etc..."
                            :rows="3" resize />
                    </UFormField>
                </div>

                <USeparator />

                <!-- Project Settings Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-currency-euro" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Tarification</h2>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Prix initial et conditions
                                financières</p>
                        </div>
                    </div>

                    <UFormField label="Prix initial" name="initial_price"
                        help="Montant de base avant options et suppléments">
                        <UInput v-model="editState.initial_price" type="number" placeholder="1500.00" step="0.01"
                            min="0" icon="i-heroicons-currency-euro">
                            <template #trailing>
                                <span class="text-neutral-500 dark:text-neutral-400 text-xs font-medium">€</span>
                            </template>
                        </UInput>
                    </UFormField>
                </div>

                <USeparator />

                <!-- Security Settings Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sécurité</h2>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Protection et accès sécurisé</p>
                        </div>
                    </div>

                    <UFormField label="Mot de passe requis" name="require_password"
                        help="Définir si un mot de passe est nécessaire pour accéder aux galeries">
                        <USwitch v-model="editState.require_password" />
                    </UFormField>

                    <UAlert :color="editState.require_password ? 'warning' : 'info'" variant="soft"
                        :icon="editState.require_password ? 'i-heroicons-key' : 'i-heroicons-information-circle'"
                        :title="editState.require_password ? 'Accès protégé' : 'Accès libre'"
                        :description="editState.require_password ? 'Un mot de passe sera généré automatiquement pour protéger l\'accès aux galeries.' : 'Le client pourra accéder aux galeries sans mot de passe.'" />
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
                    <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <UIcon name="i-heroicons-information-circle" class="w-4 h-4" />
                        <span>Les champs marqués d'un <span class="text-red-500">*</span> sont obligatoires</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <UButton color="neutral" variant="ghost" label="Annuler" :disabled="isSubmitting"
                            @click="cancelEditing" />
                        <UButton type="submit" color="primary" :loading="isSubmitting" label="Enregistrer" />
                    </div>
                </div>
            </UForm>
        </div>

        <!-- View Mode -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Client Info -->
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-user" class="w-4 h-4 text-neutral-500" />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Client</span>
                </div>
                <p class="text-neutral-900 dark:text-neutral-100">{{ clientDisplayName }}</p>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">{{ project.client?.billing_email }}</p>
            </div>

            <!-- Price Info -->
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-euro" class="w-4 h-4 text-neutral-500" />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Prix initial</span>
                </div>
                <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ formattedPrice }}</p>
            </div>

            <!-- Dates Info -->
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-calendar" class="w-4 h-4 text-neutral-500" />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Créé le</span>
                </div>
                <p class="text-neutral-900 dark:text-neutral-100">{{ formattedCreatedAt }}</p>
            </div>

            <!-- Password Hash -->
            <div v-if="project.password_hash" class="space-y-2">
                <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-key" class="w-4 h-4 text-neutral-500" />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Mot de passe</span>
                </div>
                <div>
                    <UInput :model-value="project.password_hash" :type="showPassword ? 'text' : 'password'" readonly
                        size="sm" variant="outline" :ui="{ trailing: 'pe-1' }">
                        <template #trailing>
                            <div class="flex items-center gap-1">
                                <UTooltip :text="showPassword ? 'Masquer' : 'Afficher'" :content="{ side: 'top' }">
                                    <UButton color="neutral" variant="link" size="sm"
                                        :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                                        :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                                        @click="showPassword = !showPassword" />
                                </UTooltip>
                                <UTooltip text="Copier le mot de passe" :content="{ side: 'top' }">
                                    <UButton :color="passwordCopied ? 'success' : 'neutral'" variant="link" size="sm"
                                        :icon="passwordCopied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
                                        aria-label="Copier le mot de passe" @click="copyPassword" />
                                </UTooltip>
                            </div>
                        </template>
                    </UInput>
                </div>
            </div>

            <!-- Description -->
            <div v-if="project.description" class="md:col-span-2 space-y-2">
                <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-file-text" class="w-4 h-4 text-neutral-500" />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</span>
                </div>
                <p class="text-neutral-900 dark:text-neutral-100">{{ project.description }}</p>
            </div>
        </div>
    </UCard>
</template>

<script lang="ts" setup>
import { useClientSelect } from '~/composables/clients/useClientSelect'
import type { ProjectStatusItem, ProjectWithClient } from '~/types/project'
import { projectEditSchema } from '~/types/project'

interface Props {
    project: ProjectWithClient
    clientDisplayName: string
    statusInfo: ProjectStatusItem | null
    formattedPrice: string
    formattedCreatedAt: string
    canEditProject: boolean
}

const props = defineProps<Props>()

// Store
const store = useProjectSetupStore()
const clientsStore = useClientsStore()

// Password management
const showPassword = ref(false)
const passwordCopied = ref(false)

// Edit state
const isEditing = ref(false)
const isSubmitting = ref(false)

// Edit form state
const editState = reactive({
    title: '',
    description: '',
    client_id: '',
    initial_price: null as number | null,
    require_password: false
})

// Edit form schema
const editSchema = projectEditSchema

// Computed
const { clientOptions, pending: loadingClients } = useClientSelect()


// Copy password to clipboard
const copyPassword = async () => {
    if (!props.project?.password_hash) return

    try {
        await navigator.clipboard.writeText(props.project.password_hash)
        passwordCopied.value = true
        setTimeout(() => {
            passwordCopied.value = false
        }, 2000)
    } catch (error) {
        console.error('Failed to copy password:', error)
    }
}

// Start editing
const startEditing = async () => {
    if (!props.canEditProject) return

    // Load clients if not already loaded
    if (clientsStore.clients.length === 0) {
        await clientsStore.initialize()
    }

    // Initialize edit state
    editState.title = props.project.title
    editState.description = props.project.description || ''
    editState.client_id = props.project.client_id
    editState.initial_price = props.project.initial_price
    editState.require_password = !!props.project.password_hash

    isEditing.value = true
}

// Cancel editing
const cancelEditing = () => {
    isEditing.value = false
    isSubmitting.value = false
}

// Handle edit submit
const handleEditSubmit = async (event: { data: { title: string; description?: string | null; client_id: string; initial_price?: number | null; require_password: boolean } }) => {
    isSubmitting.value = true

    try {
        await store.updateProjectInline({
            title: event.data.title,
            description: event.data.description || null,
            client_id: event.data.client_id,
            initial_price: event.data.initial_price,
            require_password: event.data.require_password
        })

        isEditing.value = false

        // Show success notification
        const toast = useToast()
        toast.add({
            title: 'Projet mis à jour',
            description: 'Les modifications ont été enregistrées avec succès',
            color: 'success'
        })
    } catch (error) {
        console.error('Failed to update project:', error)

        // Show error notification
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: error instanceof Error ? error.message : 'Impossible de mettre à jour le projet',
            color: 'error'
        })
    } finally {
        isSubmitting.value = false
    }
}
</script>