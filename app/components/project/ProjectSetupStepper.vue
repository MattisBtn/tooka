<template>
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div v-for="(step, index) in steps" :key="step.key" :class="[
            'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer',
            getStepClasses((index + 1) as WorkflowStep)
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
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { WorkflowStep } from '~/types/project';

interface Props {
    currentStep: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
    'step-changed': [stepNumber: number]
}>()

const steps = [
    { key: 'proposal', title: 'Proposition', description: 'Devis et contrat' },
    { key: 'moodboard', title: 'Moodboard', description: 'Inspiration visuelle' },
    { key: 'selection', title: 'Sélection', description: 'Choix client' },
    { key: 'gallery', title: 'Galerie', description: 'Livrable final' }
]

// Use project setup store
const store = useProjectSetupStore()

const getStepDisplayStatus = (stepNumber: WorkflowStep): { status: 'completed' | 'in_progress' | 'locked', canView: boolean } => {
    const stepKey = steps[stepNumber - 1]?.key as keyof typeof store.modules
    if (!stepKey) return { status: 'locked', canView: false }

    const module = store.modules[stepKey]

    if (module.completed) {
        return { status: 'completed', canView: true }
    }

    if (module.enabled) {
        return { status: 'in_progress', canView: true }
    }

    return { status: 'locked', canView: true }
}

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

    if (status?.status === 'locked') {
        return 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 opacity-50 cursor-not-allowed'
    }

    if (status?.canView) {
        return 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
    }

    return 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 opacity-50 cursor-not-allowed'
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

    if (status?.canView) {
        return 'text-sm font-medium text-neutral-600 dark:text-neutral-400'
    }

    return 'text-sm font-medium text-neutral-400 dark:text-neutral-500'
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