<template>
    <div class="space-y-6">
        <UCard>
            <template #header>
                <div class="flex items-center gap-3">
                    <div
                        class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                        <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-white dark:text-black" />
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sécurité</h3>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">Protection et accès sécurisé à votre
                            compte</p>
                    </div>
                </div>
            </template>

            <div class="space-y-6">
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-key" class="w-4 h-4 text-white dark:text-black" />
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Mot de passe</h4>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Gérez votre mot de passe principal
                            </p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <p class="text-sm text-neutral-500 mb-4">
                            Dernière modification: {{ securitySettings.lastPasswordChange }}
                        </p>
                        <UButton color="primary" variant="outline" size="sm">
                            Changer le mot de passe
                        </UButton>
                    </div>
                </div>

                <USeparator />

                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4 text-white dark:text-black" />
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Authentification à
                                deux
                                facteurs</h4>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Sécurisez votre compte avec un
                                code de
                                vérification</p>
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <UBadge :color="securitySettings.twoFactorEnabled ? 'success' : 'warning'" variant="subtle">
                                {{ securitySettings.twoFactorEnabled ? 'Activé' : 'Désactivé' }}
                            </UBadge>
                        </div>
                        <UButton color="primary" variant="outline" size="sm">
                            {{ securitySettings.twoFactorEnabled ? 'Désactiver' : 'Activer' }}
                        </UButton>
                    </div>
                </div>

                <USeparator />

                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4 text-white dark:text-black" />
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sessions actives
                            </h4>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Gérez vos connexions actives</p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <p class="text-sm text-neutral-500 mb-4">
                            Vous avez {{ securitySettings.activeSessions }} sessions actives
                        </p>
                        <UButton color="error" variant="outline" size="sm">
                            Déconnecter toutes les sessions
                        </UButton>
                    </div>
                </div>
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
interface SecuritySettings {
    twoFactorEnabled: boolean
    lastPasswordChange: string
    activeSessions: number
}

interface Props {
    securitySettings: SecuritySettings
}

defineProps<Props>()
</script>
