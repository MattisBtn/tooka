<template>
    <div class="space-y-4">
        <UFormField label="Type de liste" name="listType">
            <URadioGroup :model-value="component.listType" :items="[
                { value: 'bulleted', label: 'Liste à puces' },
                { value: 'numbered', label: 'Liste numérotée' }
            ]" @update:model-value="$emit('update', { listType: $event as 'bulleted' | 'numbered' })" />
        </UFormField>

        <UFormField label="Éléments de la liste" name="items" required>
            <div class="space-y-2">
                <div v-for="(item, index) in component.items" :key="index" class="flex items-center gap-2">
                    <UInput :model-value="item" :placeholder="`Élément ${index + 1}`" class="flex-1"
                        @input="updateItem(index, $event.target.value)" />
                    <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error"
                        :disabled="component.items.length <= 1" @click="removeItem(index)" />
                </div>
                <UButton icon="i-lucide-plus" label="Ajouter un élément" size="sm" variant="outline" class="w-full"
                    @click="addItem" />
            </div>
        </UFormField>

        <AlignmentSelector :model-value="component.alignment"
            @update:model-value="$emit('update', { alignment: $event })" />
    </div>
</template>

<script lang="ts" setup>
import type { ListComponent } from '~/composables/proposals/useProposalComponentTypes';
import AlignmentSelector from './AlignmentSelector.vue';

interface Props {
    component: ListComponent;
}

interface Emits {
    (e: 'update', updates: { items?: string[]; listType?: 'bulleted' | 'numbered'; alignment?: 'left' | 'center' | 'right' }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const updateItem = (index: number, value: string) => {
    const newItems = [...props.component.items];
    newItems[index] = value;
    emit('update', { items: newItems });
};

const addItem = () => {
    const newItems = [...props.component.items, 'Nouvel élément'];
    emit('update', { items: newItems });
};

const removeItem = (index: number) => {
    if (props.component.items.length <= 1) return;
    const newItems = props.component.items.filter((_, i) => i !== index);
    emit('update', { items: newItems });
};
</script>