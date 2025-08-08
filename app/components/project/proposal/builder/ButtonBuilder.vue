<template>
    <div class="space-y-4">
        <UFormField label="Texte du bouton" name="text" required>
            <UInput :model-value="component.text" placeholder="Ex: Réserver maintenant"
                @input="$emit('update', { text: $event.target.value })" />
        </UFormField>

        <UFormField label="Style du bouton" name="variant">
            <URadioGroup :model-value="component.variant" :items="[
                { value: 'solid', label: 'Solide (rempli)' },
                { value: 'outline', label: 'Contour uniquement' },
                { value: 'ghost', label: 'Fantôme (transparent)' },
                { value: 'link', label: 'Lien simple' }
            ]" @update:model-value="$emit('update', { variant: $event as 'solid' | 'outline' | 'ghost' | 'link' })" />
        </UFormField>

        <UFormField label="Taille du bouton" name="size">
            <URadioGroup :model-value="component.size" :items="[
                { value: 'xs', label: 'Très petit' },
                { value: 'sm', label: 'Petit' },
                { value: 'md', label: 'Moyen' },
                { value: 'lg', label: 'Grand' },
                { value: 'xl', label: 'Très grand' }
            ]" @update:model-value="$emit('update', { size: $event as 'xs' | 'sm' | 'md' | 'lg' | 'xl' })" />
        </UFormField>

        <UFormField label="Lien (optionnel)" name="link" hint="URL ou adresse email">
            <UInput :model-value="component.link || ''"
                placeholder="Ex: https://monsite.com ou mailto:contact@email.com"
                @input="$emit('update', { link: $event.target.value || undefined })" />
        </UFormField>

        <AlignmentSelector :model-value="component.alignment"
            @update:model-value="$emit('update', { alignment: $event })" />
    </div>
</template>

<script lang="ts" setup>
import type { ButtonComponent } from '~/composables/proposals/useProposalComponentTypes';
import AlignmentSelector from './AlignmentSelector.vue';

interface Props {
    component: ButtonComponent;
}

interface Emits {
    (e: 'update', updates: {
        text?: string;
        variant?: 'solid' | 'outline' | 'ghost' | 'link';
        size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
        link?: string;
        alignment?: 'left' | 'center' | 'right';
    }): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>