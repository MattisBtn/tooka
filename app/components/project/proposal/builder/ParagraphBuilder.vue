<template>
    <div class="space-y-4">
        <UFormField label="Contenu du paragraphe" name="content" required>
            <UTextarea :model-value="component.content" placeholder="Entrez le contenu du paragraphe..." :rows="8"
                @input="$emit('update', { content: $event.target.value })" />
        </UFormField>

        <AlignmentSelector :model-value="component.alignment"
            @update:model-value="$emit('update', { alignment: $event })" />
    </div>
</template>

<script lang="ts" setup>
import type { ParagraphComponent } from '~/composables/proposals/useProposalContentBuilder';
import AlignmentSelector from './AlignmentSelector.vue';

interface Props {
    component: ParagraphComponent;
}

interface Emits {
    (e: 'update', updates: { content?: string; alignment?: 'left' | 'center' | 'right' }): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>