<template>
    <div class="space-y-4">
        <UFormField label="Mode" name="mode">
            <URadioGroup :model-value="component.mode" :items="[
                { value: 'standard', label: 'Standard' },
                { value: 'forfait', label: 'Forfait (1 ligne, description longue)' },
                { value: 'pack', label: 'Pack (10, 20, 30 photos...)' }
            ]" @update:model-value="setMode" />
        </UFormField>


        <UFormField label="Devise" name="currency">
            <USelect :model-value="component.currency || 'EUR'" :items="currencyOptions" option-attribute="label"
                value-attribute="value" @update:model-value="setCurrency" />
        </UFormField>

        <UFormField label="Alignement" name="alignment">
            <URadioGroup :model-value="component.alignment" orientation="horizontal" :items="[
                { value: 'left', label: 'Gauche' },
                { value: 'center', label: 'Centre' },
                { value: 'right', label: 'Droite' }
            ]" @update:model-value="$emit('update', { alignment: $event })" />
        </UFormField>

        <div class="flex items-center justify-between">
            <div class="text-sm text-neutral-600 dark:text-neutral-400">Lignes du devis</div>
            <div class="flex items-center gap-2">
                <UButton v-if="component.mode === 'pack'" icon="i-lucide-package" size="xs" variant="outline"
                    color="primary" @click="applyPackPreset(10)">Pack 10</UButton>
                <UButton v-if="component.mode === 'pack'" icon="i-lucide-package" size="xs" variant="outline"
                    color="primary" @click="applyPackPreset(20)">Pack 20</UButton>
                <UButton v-if="component.mode === 'pack'" icon="i-lucide-package" size="xs" variant="outline"
                    color="primary" @click="applyPackPreset(30)">Pack 30</UButton>
                <UButton icon="i-lucide-plus" size="xs" variant="outline" @click="addItem">Ajouter une ligne</UButton>
            </div>
        </div>

        <div class="space-y-3">
            <div v-for="(it, idx) in component.items" :key="idx"
                class="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                <div class="grid grid-cols-12 gap-2 items-start">
                    <div class="col-span-12">
                        <UFormField label="Prestation" :name="`name-${idx}`" required>
                            <UInput :model-value="it.name" placeholder="Ex: Shooting 2h"
                                @input="updateItem(idx, { name: $event.target.value })" />
                        </UFormField>
                    </div>
                    <div class="col-span-12">
                        <UFormField label="Description" :name="`desc-${idx}`">
                            <UTextarea :model-value="it.description || ''" rows="3"
                                placeholder="Détails de la prestation"
                                @input="updateItem(idx, { description: $event.target.value || undefined })" />
                        </UFormField>
                    </div>
                    <template v-if="component.mode !== 'forfait'">
                        <div class="col-span-4">
                            <UFormField label="Quantité" :name="`qty-${idx}`" required>
                                <UInput type="number" min="1" :model-value="it.quantity"
                                    @input="updateItem(idx, { quantity: toInt($event.target.value, 1) })" />
                            </UFormField>
                        </div>
                        <div class="col-span-4">
                            <UFormField label="PU HT" :name="`unit-${idx}`" required>
                                <UInput type="number" min="0" step="0.01" :model-value="it.unitPrice"
                                    @input="updateItem(idx, { unitPrice: toNumber($event.target.value, 0) })" />
                            </UFormField>
                        </div>
                        <div class="col-span-4">
                            <UFormField label="Total HT" :name="`total-${idx}`">
                                <UInput :model-value="formatCurrency(it.quantity * it.unitPrice)" readonly />
                            </UFormField>
                        </div>
                    </template>
                    <div class="col-span-12 flex justify-end">
                        <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error"
                            @click="removeItem(idx)" />
                    </div>
                </div>
            </div>
        </div>

        <div class="flex items-center justify-between border-t pt-3 border-neutral-200 dark:border-neutral-700">
            <div class="text-sm font-medium">Total HT</div>
            <div class="text-sm font-semibold">{{ formatCurrency(total) }}</div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { PricingComponent } from '~/composables/proposals/useProposalComponentTypes';

interface Props {
    component: PricingComponent;
}

interface Emits {
    (e: 'update', updates: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const currencyOptions = [
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'USD', label: 'Dollar ($)' },
    { value: 'GBP', label: 'Livre (£)' }
];

const toInt = (v: string, fallback: number) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

const toNumber = (v: string, fallback: number) => {
    const n = parseFloat(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const formatCurrency = (n: number) => {
    const currency = props.component.currency || 'EUR';
    try {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
    } catch {
        return `${(n || 0).toFixed(2)} ${currency}`;
    }
};

const total = computed(() => props.component.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0));

const addItem = () => {
    const next = [...props.component.items, { name: 'Nouvelle prestation', description: '', quantity: 1, unitPrice: 0 }];
    emit('update', { pricingItems: next });
};

const removeItem = (idx: number) => {
    const next = props.component.items.filter((_, i) => i !== idx);
    emit('update', { pricingItems: next });
};

const updateItem = (idx: number, partial: Partial<{ name: string; description?: string; quantity: number; unitPrice: number }>) => {
    const next = props.component.items.map((it, i) => (i === idx ? { ...it, ...partial } : it));
    emit('update', { pricingItems: next });
};

const setCurrency = (c: 'EUR' | 'USD' | 'GBP') => {
    emit('update', { currency: c });
};

const setMode = (mode: 'standard' | 'forfait' | 'pack') => {
    // Ensure constraints: forfait => single line
    let items = props.component.items;
    if (mode === 'forfait') {
        const current = items[0] || { name: 'Forfait', description: 'Description du forfait', quantity: 1, unitPrice: 0 };
        items = [{ ...current, quantity: 1 }];
    }
    if (mode === 'pack' && items.length === 0) {
        items = [{ name: 'Pack 10 photos', description: 'Traitement inclus', quantity: 10, unitPrice: 0 }];
    }
    emit('update', { mode, pricingItems: items });
};

const applyPackPreset = (count: number) => {
    if (props.component.mode !== 'pack') return;
    const unit = props.component.items[0]?.unitPrice || 0;
    const next = [{ name: `Pack ${count} photos`, description: 'Traitement inclus', quantity: count, unitPrice: unit }];
    emit('update', { pricingItems: next });
};
</script>
