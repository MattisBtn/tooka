<template>
    <div
class="group relative bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer"
        :class="{
            'border-primary-300 dark:border-primary-700 shadow-lg': isSelected,
            'hover:border-neutral-300 dark:hover:border-neutral-600': !isSelected
        }" @click="$emit('select')">
        <!-- Component Actions (on hover) -->
        <div
            class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <UButton
icon="i-lucide-arrow-up" size="xs" variant="ghost" color="neutral" :disabled="!canMoveUp"
                @click.stop="$emit('move', 'up')" />
            <UButton
icon="i-lucide-arrow-down" size="xs" variant="ghost" color="neutral" :disabled="!canMoveDown"
                @click.stop="$emit('move', 'down')" />
            <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error" @click.stop="$emit('remove')" />
        </div>

        <!-- Component Content -->
        <div class="p-6" :class="getAlignmentClass(component.alignment)">
            <!-- Title Component -->
            <div v-if="component.type === 'title'">
                <h1
v-if="(component as TitleComponent).level === 1"
                    class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    {{ component.content }}
                </h1>
                <h2
v-else-if="(component as TitleComponent).level === 2"
                    class="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {{ component.content }}
                </h2>
                <h3 v-else class="text-xl font-medium text-neutral-900 dark:text-neutral-100">
                    {{ component.content }}
                </h3>
            </div>

            <!-- Paragraph Component -->
            <div v-else-if="component.type === 'paragraph'">
                <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {{ component.content }}
                </p>
            </div>

            <!-- List Component -->
            <div v-else-if="component.type === 'list'">
                <ul
v-if="(component as ListComponent).listType === 'bulleted'"
                    class="list-disc list-inside space-y-1 text-neutral-700 dark:text-neutral-300">
                    <li v-for="item in (component as ListComponent).items" :key="item">
                        {{ item }}
                    </li>
                </ul>
                <ol v-else class="list-decimal list-inside space-y-1 text-neutral-700 dark:text-neutral-300">
                    <li v-for="item in (component as ListComponent).items" :key="item">
                        {{ item }}
                    </li>
                </ol>
            </div>

            <!-- Button Component -->
            <div v-else-if="component.type === 'button'">
                <UButton
:label="(component as ButtonComponent).text" :variant="(component as ButtonComponent).variant"
                    :size="(component as ButtonComponent).size" :to="(component as ButtonComponent).link"
                    :disabled="!(component as ButtonComponent).link" class="inline-flex" />
            </div>

            <!-- Separator Component -->
            <div
v-else-if="component.type === 'separator'"
                :class="getSeparatorSpacingClass((component as SeparatorComponent).spacing)">
                <!-- Line separator -->
                <hr
v-if="(component as SeparatorComponent).style === 'line'"
                    class="border-neutral-300 dark:border-neutral-600">

                <!-- Dashed separator -->
                <hr
v-else-if="(component as SeparatorComponent).style === 'dashed'"
                    class="border-neutral-300 dark:border-neutral-600 border-dashed">

                <!-- Dotted separator -->
                <hr
v-else-if="(component as SeparatorComponent).style === 'dotted'"
                    class="border-neutral-300 dark:border-neutral-600 border-dotted border-2">

                <!-- Space separator -->
                <div v-else-if="(component as SeparatorComponent).style === 'space'" class="w-full" />

                <!-- Ornament separator -->
                <div
v-else-if="(component as SeparatorComponent).style === 'ornament'"
                    class="flex items-center justify-center">
                    <div class="flex items-center space-x-2 text-neutral-400">
                        <div class="w-2 h-2 bg-current rounded-full" />
                        <div class="w-2 h-2 bg-current rounded-full" />
                        <div class="w-2 h-2 bg-current rounded-full" />
                    </div>
                </div>
            </div>

            <!-- Pricing Component -->
            <div v-else-if="component.type === 'pricing'">
                <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-left text-neutral-600 dark:text-neutral-300">
                                <th class="py-2 px-3">Prestation</th>
                                <th v-if="(component as any).mode !== 'forfait'" class="py-2 px-3">Qté</th>
                                <th v-if="(component as any).mode !== 'forfait'" class="py-2 px-3">PU HT</th>
                                <th class="py-2 px-3 text-right">Total HT</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
v-for="(it, idx) in (component as any).items" :key="idx"
                                class="border-t border-neutral-200 dark:border-neutral-700">
                                <td class="py-3 px-3 align-top">
                                    <div class="font-medium text-neutral-900 dark:text-neutral-100">{{ it.name }}</div>
                                    <div v-if="it.description" class="text-sm text-neutral-600 dark:text-neutral-400">
                                        {{ it.description }}
                                    </div>
                                </td>
                                <td v-if="(component as any).mode !== 'forfait'" class="py-3 px-3 align-top">
                                    {{ it.quantity }}
                                </td>
                                <td v-if="(component as any).mode !== 'forfait'" class="py-3 px-3 align-top">
                                    {{ formatCurrency(it.unitPrice, (component as any).currency || 'EUR') }}
                                </td>
                                <td class="py-3 px-3 align-top text-right">
                                    {{ formatCurrency(it.quantity * it.unitPrice, (component as any).currency || 'EUR') }}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="border-t-2 border-neutral-300 dark:border-neutral-600">
                                <td class="py-3 px-3 font-semibold" :colspan="(component as any).mode === 'forfait' ? 2 : 3">
                                    Total HT
                                </td>
                                <td class="py-3 px-3 text-right font-semibold">
                                    {{ formatCurrency(((component as any).items || []).reduce((s: number, it: any) => s + it.quantity * it.unitPrice, 0), (component as any).currency || 'EUR') }}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { ButtonComponent, ListComponent, ProposalComponent, SeparatorComponent, TitleComponent } from '~/composables/proposals/useProposalComponentTypes';

interface Props {
    component: ProposalComponent;
    isSelected: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

interface Emits {
    (e: 'select' | 'remove'): void;
    (e: 'move', direction: 'up' | 'down'): void;
}

defineProps<Props>();
defineEmits<Emits>();

// Helper functions for styling
const getAlignmentClass = (alignment: 'left' | 'center' | 'right') => {
    switch (alignment) {
        case 'center': return 'text-center';
        case 'right': return 'text-right';
        default: return 'text-left';
    }
};

const getSeparatorSpacingClass = (spacing: 'small' | 'medium' | 'large') => {
    switch (spacing) {
        case 'small': return 'py-2';
        case 'large': return 'py-8';
        default: return 'py-4';
    }
};

const formatCurrency = (n: number, currency: 'EUR' | 'USD' | 'GBP') => {
    try {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
    } catch {
        return `${n.toFixed(2)} ${currency}`;
    }
};
</script>