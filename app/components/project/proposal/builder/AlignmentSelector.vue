<template>
    <UFormField label="Alignement" name="alignment">
        <URadioGroup :model-value="modelValue" orientation="horizontal" :items="[
            { value: 'left', label: 'Gauche' },
            { value: 'center', label: 'Centre' },
            { value: 'right', label: 'Droite' }
        ]" @update:model-value="$emit('update:modelValue', $event as 'left' | 'center' | 'right')" />
    </UFormField>
</template>

<script lang="ts" setup>
interface Props {
    modelValue: 'left' | 'center' | 'right';
}

interface Emits {
    (e: 'update:modelValue', value: 'left' | 'center' | 'right'): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>