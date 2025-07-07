<template>
    <div class="space-y-4">
        <UFormField label="Style du séparateur" name="style">
            <URadioGroup :model-value="component.style" :items="[
                { value: 'line', label: 'Ligne continue' },
                { value: 'dashed', label: 'Ligne pointillée' },
                { value: 'dotted', label: 'Points' },
                { value: 'space', label: 'Espace vide' },
                { value: 'ornament', label: 'Ornement décoratif' }
            ]"
                @update:model-value="$emit('update', { style: $event as 'line' | 'dashed' | 'dotted' | 'space' | 'ornament' })" />
        </UFormField>

        <UFormField label="Espacement" name="spacing">
            <URadioGroup :model-value="component.spacing" :items="[
                { value: 'small', label: 'Petit' },
                { value: 'medium', label: 'Moyen' },
                { value: 'large', label: 'Grand' }
            ]" @update:model-value="$emit('update', { spacing: $event as 'small' | 'medium' | 'large' })" />
        </UFormField>

        <AlignmentSelector :model-value="component.alignment"
            @update:model-value="$emit('update', { alignment: $event })" />
    </div>
</template>

<script lang="ts" setup>
import type { SeparatorComponent } from '~/composables/proposals/useProposalContentBuilder';
import AlignmentSelector from './AlignmentSelector.vue';

interface Props {
    component: SeparatorComponent;
}

interface Emits {
    (e: 'update', updates: {
        style?: 'line' | 'dashed' | 'dotted' | 'space' | 'ornament';
        spacing?: 'small' | 'medium' | 'large';
        alignment?: 'left' | 'center' | 'right';
    }): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>