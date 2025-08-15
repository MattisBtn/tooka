<template>
    <UCard variant="outline">
        <template #header>
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                        <UIcon name="i-lucide-info" class="w-5 h-5 text-white dark:text-black" />
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
        <ProjectModal v-if="isEditing" v-model="isEditing" :project="project" @success="handleEditSuccess" />

        <!-- View Mode -->
        <div v-else class="space-y-4">
            <!-- Project Information -->
            <div class="space-y-3">
                <div class="flex items-center gap-3">
                    <div
                        class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                        <UIcon name="i-heroicons-folder" class="w-4 h-4 text-white dark:text-black" />
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations du projet
                        </h3>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">Détails principaux et identification
                            du projet
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UFormField label="Titre du projet" name="title">
                        <UInput :model-value="project.title" readonly class="w-full" icon="i-heroicons-document-text" />
                    </UFormField>

                    <UFormField label="Client" name="client">
                        <UInput :model-value="clientDisplayName" readonly class="w-full"
                            icon="i-heroicons-user-group" />
                    </UFormField>
                </div>

                <UFormField v-if="project.description" label="Description" name="description" class="w-full">
                    <UTextarea :model-value="project.description" readonly :rows="2" class="w-full" />
                </UFormField>
            </div>

            <USeparator />

            <!-- Project Settings -->
            <div class="space-y-3">
                <div class="flex items-center gap-3">
                    <div
                        class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                        <UIcon name="i-heroicons-currency-euro" class="w-4 h-4 text-white dark:text-black" />
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Tarification</h3>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">Prix et conditions financières</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UFormField label="Prix" name="price">
                        <UInput :model-value="formattedPrice" readonly class="w-full" icon="i-heroicons-currency-euro">
                            <template #trailing>
                                <span class="text-neutral-500 dark:text-neutral-400 text-xs font-medium">€</span>
                            </template>
                        </UInput>
                    </UFormField>

                    <UFormField label="Créé le" name="created_at">
                        <UInput :model-value="formattedCreatedAt" readonly class="w-full" icon="i-heroicons-calendar" />
                    </UFormField>
                </div>
            </div>

            <!-- Security Settings -->
            <div v-if="project.password_hash" class="space-y-3">
                <USeparator />

                <div class="flex items-center gap-3">
                    <div
                        class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                        <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-white dark:text-black" />
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sécurité</h3>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">Protection et accès sécurisé</p>
                    </div>
                </div>

                <UFormField label="Mot de passe" name="password">
                    <UInput :model-value="project.password_hash" :type="showPassword ? 'text' : 'password'" readonly
                        class="w-full" icon="i-heroicons-key" :ui="{ trailing: 'pe-1' }">
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
                </UFormField>
            </div>
        </div>
    </UCard>
</template>

<script lang="ts" setup>

import type { ProjectStatusItem, ProjectWithClient } from '~/types/project'

interface Props {
    project: ProjectWithClient
    clientDisplayName: string
    statusInfo: ProjectStatusItem | null
    formattedPrice: string
    formattedCreatedAt: string
    canEditProject: boolean
}

const props = defineProps<Props>()

// Password management
const showPassword = ref(false)
const passwordCopied = ref(false)

// Edit state
const isEditing = ref(false)

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
const startEditing = () => {
    if (!props.canEditProject) return
    isEditing.value = true
}

// Handle edit success
const handleEditSuccess = async (_updatedProject: ProjectWithClient) => {
    // Update the project in the store
    const projectSetupStore = useProjectSetupStore()
    await projectSetupStore.refreshProject()
    isEditing.value = false
}
</script>