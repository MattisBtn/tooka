<template>
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div v-for="(step, index) in steps" :key="step.key" :class="[
            'flex items-center gap-3 p-3 rounded-lg border transition-all',
            getStepClasses((index + 1) as WorkflowStep),
            getStepInteractionClasses((index + 1) as WorkflowStep)
        ]" @click="handleStepClick(index + 1)">
            <div :class="getStepIconClasses((index + 1) as WorkflowStep)">
                <UIcon v-if="getStepDisplayStatus((index + 1) as WorkflowStep)?.status === 'completed'"
                    name="i-lucide-check" class="w-4 h-4" />
                <span v-else>{{ index + 1 }}</span>
            </div>

            <div>
                <p :class="getStepTitleClasses((index + 1) as WorkflowStep)">
                    {{ step.title }}
                </p>
                <p class="text-xs text-neutral-500 dark:text-neutral-500">
                    {{ step.description }}
                </p>

                <div class="flex gap-1 mt-1">
                    <UBadge v-if="getStepDisplayStatus((index + 1) as WorkflowStep)?.status === 'completed'"
                        color="success" variant="subtle" size="xs" label="Terminé" />
                    <UBadge v-else-if="getStepDisplayStatus((index + 1) as WorkflowStep)?.status === 'in_progress'"
                        color="warning" variant="subtle" size="xs" label="En cours" />
                    <UBadge v-else-if="getStepDisplayStatus((index + 1) as WorkflowStep)?.status === 'locked'"
                        color="neutral" variant="subtle" size="xs" label="Verrouillé" />
                    <UBadge v-else-if="getStepDisplayStatus((index + 1) as WorkflowStep)?.status === 'not_started'"
                        color="neutral" variant="subtle" size="xs" label="Non démarré" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { WorkflowStep } from '~/types/project';
import { getStepStatus, type StepInfo } from '~/utils/formatters';

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
    { key: 'proposal', title: 'Proposition', description: 'Devis et contrat' },
    { key: 'moodboard', title: 'Moodboard', description: 'Inspiration visuelle' },
    { key: 'selection', title: 'Sélection', description: 'Choix client' },
    { key: 'gallery', title: 'Galerie', description: 'Livrable final' }
]

const getStepDisplayStatus = (stepNumber: WorkflowStep): StepInfo | null => {
    if (!projectSetupStore.project) return null;

    return getStepStatus(stepNumber, projectSetupStore.project);
}

// Helper function to determine the most advanced step
const getMostAdvancedStep = (): WorkflowStep => {
    if (!projectSetupStore.project) return 1;

    const moduleMap = {
        1: "proposal",
        2: "moodboard",
        3: "selection",
        4: "gallery",
    } as const;

    // Check from the end to find the most advanced step
    for (let i = 4; i >= 1; i--) {
        const moduleKey = moduleMap[i as keyof typeof moduleMap];
        const module = projectSetupStore.project[moduleKey as keyof typeof projectSetupStore.project];

        // Type guard to check if module exists and has status property
        if (module && typeof module === 'object' && 'status' in module && module.status !== "draft") {
            return i as WorkflowStep;
        }
    }

    // If no advanced step found, return the first step
    return 1;
}

// Auto-select the most advanced step when project changes
watch(() => projectSetupStore.project, () => {
    if (projectSetupStore.project) {
        const mostAdvancedStep = getMostAdvancedStep();
        if (mostAdvancedStep !== props.currentStep) {
            emit('step-changed', mostAdvancedStep);
        }
    }
}, { immediate: true })

const getStepClasses = (stepNumber: WorkflowStep) => {
    const status = getStepDisplayStatus(stepNumber)
    const isCurrentStep = stepNumber === props.currentStep

    if (isCurrentStep) {
        return 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
    }

    if (status?.status === 'completed') {
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
    }

    if (status?.status === 'in_progress') {
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }

    if (status?.status === 'not_started') {
        return 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
    }

    if (status?.status === 'locked') {
        return 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 opacity-50'
    }

    if (status?.canView) {
        return 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
    }

    return 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 opacity-50'
}

const getStepInteractionClasses = (stepNumber: WorkflowStep) => {
    const status = getStepDisplayStatus(stepNumber)

    if (status?.status === 'locked') {
        return 'cursor-not-allowed'
    }

    if (status?.canView) {
        return 'cursor-pointer'
    }

    return 'cursor-not-allowed'
}

const getStepIconClasses = (stepNumber: WorkflowStep) => {
    const status = getStepDisplayStatus(stepNumber)
    const isCurrentStep = stepNumber === props.currentStep

    if (isCurrentStep) {
        return 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-primary-500'
    }

    if (status?.status === 'completed') {
        return 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-emerald-500 text-white'
    }

    if (status?.status === 'in_progress') {
        return 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-blue-500 text-white'
    }

    if (status?.status === 'not_started') {
        return 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-neutral-300 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-400'
    }

    if (status?.canView) {
        return 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-neutral-300 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-400'
    }

    return 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500'
}

const getStepTitleClasses = (stepNumber: WorkflowStep) => {
    const status = getStepDisplayStatus(stepNumber)
    const isCurrentStep = stepNumber === props.currentStep

    if (isCurrentStep) {
        return 'text-sm font-medium text-primary-700 dark:text-primary-300'
    }

    if (status?.status === 'completed') {
        return 'text-sm font-medium text-emerald-700 dark:text-emerald-300'
    }

    if (status?.status === 'in_progress') {
        return 'text-sm font-medium text-blue-700 dark:text-blue-300'
    }

    if (status?.status === 'not_started') {
        return 'text-sm font-medium text-neutral-600 dark:text-neutral-400'
    }

    if (status?.canView) {
        return 'text-sm font-medium text-neutral-600 dark:text-neutral-400'
    }

    return 'text-sm font-medium text-neutral-400 dark:text-neutral-500'
}

const handleStepClick = (stepNumber: number) => {
    const workflowStep = stepNumber as WorkflowStep
    const status = getStepDisplayStatus(workflowStep)

    if (!status?.canView || status?.status === 'locked') {
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