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
                <UBadge :color="(statusInfo?.color as any) || 'gray'" variant="subtle"
                    :label="statusInfo?.label || project.status" :icon="statusInfo?.icon" />
            </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            <!-- Link Expiration -->
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-link" class="w-4 h-4 text-neutral-500" />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Lien expire le</span>
                </div>
                <p class="text-neutral-900 dark:text-neutral-100">{{ formattedExpiresAt }}</p>
            </div>

            <!-- Password Hash -->
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-key" class="w-4 h-4 text-neutral-500" />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Mot de passe</span>
                </div>
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
import type { ProjectStatusItem, ProjectWithClient } from '~/types/project'

interface Props {
    project: ProjectWithClient
    clientDisplayName: string
    statusInfo: ProjectStatusItem | null
    formattedPrice: string
    formattedCreatedAt: string
    formattedExpiresAt: string
}

const props = defineProps<Props>()

// Password management
const showPassword = ref(false)
const passwordCopied = ref(false)

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
</script>