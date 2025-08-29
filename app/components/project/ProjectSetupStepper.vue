<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UTooltip v-for="(step, index) in steps" :key="step.key" :text="getStepTooltip((index + 1) as WorkflowStep)"
            :popper="{ placement: 'top' }">
            <div :class="getStepCardClasses((index + 1) as WorkflowStep)" @click="handleStepClick(index + 1)">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div :class="getStepIconClasses((index + 1) as WorkflowStep)">
                            <UIcon
                                v-if="getStepDisplayStatus((index + 1) as WorkflowStep)?.moduleStatus === 'completed'"
                                name="i-lucide-check" class="w-4 h-4" />
                            <span v-else class="text-sm font-medium">{{ index + 1 }}</span>
                        </div>

                        <div class="flex-1 min-w-0">
                            <h3 :class="getStepTitleClasses((index + 1) as WorkflowStep)">
                                {{ step.title }}
                            </h3>
                            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {{ step.description }}
                            </p>
                        </div>
                    </div>

                    <UBadge :color="getStepBadgeColor((index + 1) as WorkflowStep)"
                        :label="getStepBadgeLabel((index + 1) as WorkflowStep)" variant="subtle" size="xs"
                        class="ml-2 flex-shrink-0" />
                </div>
            </div>
        </UTooltip>
    </div>
</template>

<script lang="ts" setup>
import { getStepStatus } from '~/composables/projects/useProjectSteps';
import type { StepInfo, WorkflowStep } from '~/types/project';

interface Props {
    currentStep: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
    'step-changed': [stepNumber: number]
}>()

// Use projectSetup store directly
const projectSetupStore = useProjectSetupStore()

const steps = [
    { key: 'moodboard', title: 'Moodboard', description: 'Inspiration visuelle' },
    { key: 'selection', title: 'Sélection', description: 'Choix client' },
    { key: 'gallery', title: 'Galerie', description: 'Livrable final' }
]

const getStepDisplayStatus = (stepNumber: WorkflowStep): StepInfo | null => {
    if (!projectSetupStore.project) return null;

    return getStepStatus(stepNumber as 1 | 2 | 3, projectSetupStore.project);
}

// Helper function to determine the default step to show
const getDefaultStep = (): WorkflowStep => {
    if (!projectSetupStore.project) return 2;

    const project = projectSetupStore.project;

    // Find the highest step that exists (is started)
    if (project.gallery) return 4;
    if (project.selection) return 3;
    if (project.moodboard) return 2;

    return 2;
}

// Auto-select the default step when project changes
watch(() => projectSetupStore.project, () => {
    if (projectSetupStore.project) {
        const defaultStep = getDefaultStep();
        if (defaultStep !== props.currentStep) {
            emit('step-changed', defaultStep);
        }
    }
}, { immediate: true })

const getStepCardClasses = (stepNumber: WorkflowStep) => {
    const status = getStepDisplayStatus(stepNumber)
    const isCurrentStep = stepNumber === props.currentStep

    const baseClasses = 'p-4 rounded-xl border transition-all duration-200'
    const interactionClasses = status?.canView ? 'cursor-pointer hover:shadow-sm' : 'cursor-not-allowed'

    if (isCurrentStep) {
        return `${baseClasses} ${interactionClasses} bg-black text-white border-black dark:bg-white dark:text-black dark:border-white`
    }

    if (status?.moduleStatus === 'completed') {
        return `${baseClasses} ${interactionClasses} bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800`
    }

    if (status?.status === 'locked') {
        return `${baseClasses} ${interactionClasses} bg-zinc-50 border-zinc-200 opacity-60 dark:bg-zinc-900 dark:border-zinc-700`
    }

    return `${baseClasses} ${interactionClasses} bg-white border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800`
}

const getStepIconClasses = (stepNumber: WorkflowStep) => {
    const status = getStepDisplayStatus(stepNumber)
    const isCurrentStep = stepNumber === props.currentStep

    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center'

    if (isCurrentStep) {
        return `${baseClasses} bg-white text-black dark:bg-black dark:text-white`
    }

    if (status?.moduleStatus === 'completed') {
        return `${baseClasses} bg-emerald-500 text-white`
    }

    if (status?.canView) {
        return `${baseClasses} bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300`
    }

    return `${baseClasses} bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600`
}

const getStepTitleClasses = (stepNumber: WorkflowStep) => {
    const status = getStepDisplayStatus(stepNumber)
    const isCurrentStep = stepNumber === props.currentStep

    if (isCurrentStep) {
        return 'text-sm font-semibold'
    }

    if (status?.moduleStatus === 'completed') {
        return 'text-sm font-medium text-emerald-700 dark:text-emerald-300'
    }

    if (status?.canView) {
        return 'text-sm font-medium text-zinc-900 dark:text-zinc-100'
    }

    return 'text-sm font-medium text-zinc-400 dark:text-zinc-500'
}

const getStepBadgeColor = (stepNumber: WorkflowStep) => {
    const status = getStepDisplayStatus(stepNumber)

    if (status?.moduleStatus === 'completed') return 'success'
    if (status?.moduleExists) return 'warning'
    if (status?.status === 'locked') return 'neutral'
    return 'neutral'
}

const getStepBadgeLabel = (stepNumber: WorkflowStep) => {
    const status = getStepDisplayStatus(stepNumber)

    if (status?.moduleStatus === 'completed') return 'Terminé'
    if (status?.moduleExists) return 'En cours'
    if (status?.status === 'locked') return 'Verrouillé'
    return 'Non démarré'
}

const getStepTooltip = (stepNumber: WorkflowStep) => {
    const status = getStepDisplayStatus(stepNumber)
    const stepName = steps[stepNumber - 1]?.title || `Étape ${stepNumber}`

    if (status?.moduleStatus === 'completed') {
        return `${stepName} : Ce module est terminé et prêt pour la suite.`
    }

    if (status?.moduleExists) {
        return `${stepName} : Ce module est en cours de configuration.`
    }

    if (status?.status === 'locked') {
        // Vérifier si un step antérieur est en cours (non terminé)
        const hasInProgressPreviousStep = (() => {
            if (!projectSetupStore.project) return false

            for (let i = 1; i < stepNumber; i++) {
                const previousStepStatus = getStepDisplayStatus(i as WorkflowStep)
                if (previousStepStatus?.moduleExists && previousStepStatus?.moduleStatus !== 'completed') {
                    return true
                }
            }
            return false
        })()

        // Vérifier si un step ultérieur est en cours (non terminé)
        const hasInProgressNextStep = (() => {
            if (!projectSetupStore.project) return false

            for (let i = stepNumber + 1; i <= 3; i++) {
                const nextStepStatus = getStepDisplayStatus(i as WorkflowStep)
                if (nextStepStatus?.moduleExists && nextStepStatus?.moduleStatus !== 'completed') {
                    return true
                }
            }
            return false
        })()

        if (hasInProgressPreviousStep) {
            return `${stepName} : Ce module est verrouillé car une étape précédente est en cours.`
        }

        if (hasInProgressNextStep) {
            return `${stepName} : Ce module est verrouillé car une étape ultérieure est en cours.`
        }

        return `${stepName} : Ce module sera accessible après avoir terminé les étapes précédentes.`
    }

    return `${stepName} : Cliquez pour commencer la configuration de ce module.`
}

const handleStepClick = (stepNumber: number) => {
    const workflowStep = stepNumber as WorkflowStep
    const status = getStepDisplayStatus(workflowStep)

    if (!status?.canView) {
        const toast = useToast()
        toast.add({
            title: 'Step non accessible',
            description: 'Ce step ne peut pas être consulté.',
            icon: 'i-lucide-alert-circle',
            color: 'warning'
        })
        return
    }

    emit('step-changed', stepNumber)
}
</script>