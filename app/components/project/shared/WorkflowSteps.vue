<template>
    <div class="flex items-center gap-1">
        <div v-for="(step, index) in steps" :key="step.key" class="flex items-center">
            <div :class="[
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                getStepStatus(step.key) === 'completed'
                    ? 'bg-emerald-500 dark:bg-emerald-600 text-white'
                    : getStepStatus(step.key) === 'current'
                        ? 'bg-primary dark:bg-primary text-white dark:text-black'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
            ]">
                <UIcon v-if="getStepStatus(step.key) === 'completed'" name="i-lucide-check" class="w-3 h-3" />
                <span v-else>{{ index + 1 }}</span>
            </div>
            <span :class="[
                'ml-1 text-xs font-medium transition-colors',
                getStepStatus(step.key) === 'completed'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : getStepStatus(step.key) === 'current'
                        ? 'text-primary dark:text-primary'
                        : 'text-neutral-600 dark:text-neutral-400'
            ]">
                {{ step.label }}
            </span>
            <UIcon v-if="index < steps.length - 1" name="i-lucide-chevron-right"
                class="w-3 h-3 text-neutral-300 dark:text-neutral-600 mx-1" />
        </div>
    </div>
</template>

<script lang="ts" setup>
interface WorkflowStep {
    key: string;
    label: string;
}

interface Props {
    currentStatus: string;
    type: 'proposal' | 'moodboard' | 'selection' | 'gallery';
}

const props = defineProps<Props>();

// Define workflow steps based on type
const steps = computed<WorkflowStep[]>(() => {
    const baseSteps = [
        { key: 'draft', label: 'Brouillon' },
        { key: 'awaiting_client', label: 'En attente' },
        { key: 'revision_requested', label: 'Révision' }
    ];

    switch (props.type) {
        case 'proposal':
            return [
                ...baseSteps,
                { key: 'payment_pending', label: 'Paiement' },
                { key: 'completed', label: 'Terminé' }
            ];
        case 'gallery':
            return [
                ...baseSteps,
                { key: 'payment_pending', label: 'Paiement' },
                { key: 'completed', label: 'Terminé' }
            ];
        case 'moodboard':
        case 'selection':
            return [
                ...baseSteps,
                { key: 'completed', label: 'Terminé' }
            ];
        default:
            return baseSteps;
    }
});

// Function to determine the status of a step
const getStepStatus = (stepKey: string) => {
    const statusOrder = steps.value.map(step => step.key);
    const currentIndex = statusOrder.indexOf(props.currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex === currentIndex) return 'current';
    if (stepIndex < currentIndex) return 'completed';
    return 'pending';
};
</script>
