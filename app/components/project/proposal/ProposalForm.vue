<template>
    <div class="space-y-6">
        <UAlert color="info" variant="soft" icon="i-lucide-info" title="Formulaire en cours de développement"
            description="Le formulaire de création de proposition sera implémenté dans la prochaine étape." />

        <div class="text-center py-8">
            <UIcon name="i-lucide-file-text" class="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Formulaire de proposition
            </h3>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
                Ce formulaire permettra de créer des propositions avec plusieurs options tarifaires.
            </p>
        </div>

        <div class="flex items-center justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="$emit('cancel')">
                Annuler
            </UButton>
            <UButton color="primary" @click="handleSave">
                Sauvegarder
            </UButton>
        </div>
    </div>
</template>

<script lang="ts" setup>
interface Props {
    proposal?: unknown
    projectId: string
}

defineProps<Props>()

const emit = defineEmits<{
    'proposal-saved': [data: { proposal: Record<string, unknown> }]
    'cancel': []
}>()

const handleSave = () => {
    // TODO: Implement actual form logic
    emit('proposal-saved', {
        proposal: {
            title: 'Proposition temporaire',
            description: 'Cette proposition sera remplacée par le vrai formulaire',
            options: []
        }
    })
}
</script>
