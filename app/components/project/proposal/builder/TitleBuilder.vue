<template>
    <div class="space-y-4">
        <UFormField label="Contenu du titre" name="content" required>
            <UTextarea :model-value="component.content" placeholder="Entrez le titre..." :rows="3"
                @input="$emit('update', { content: $event.target.value })" />
        </UFormField>

        <UFormField label="Niveau du titre" name="level">
            <URadioGroup :model-value="component.level" :items="[
                { value: 1, label: 'H1 - Titre principal' },
                { value: 2, label: 'H2 - Sous-titre' },
                { value: 3, label: 'H3 - Titre de section' }
            ]" @update:model-value="$emit('update', { level: Number($event) as 1 | 2 | 3 })" />
        </UFormField>

        <AlignmentSelector :model-value="component.alignment"
            @update:model-value="$emit('update', { alignment: $event })" />
    </div>
</template>

<script lang="ts" setup>
import type { TitleComponent } from '~/composables/proposals/useProposalComponentTypes';
import AlignmentSelector from './AlignmentSelector.vue';

interface Props {
    component: TitleComponent;
}

interface Emits {
    (e: 'update', updates: { content?: string; level?: 1 | 2 | 3; alignment?: 'left' | 'center' | 'right' }): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>