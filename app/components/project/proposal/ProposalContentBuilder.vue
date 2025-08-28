<template>
    <div>
        <!-- Readonly Mode -->
        <div v-if="props.readonly" class="bg-white dark:bg-neutral-800 rounded-lg border p-6">
            <div v-if="blocks.length > 0" v-html="htmlContent" />
            <p v-else class="text-neutral-500">Aucun contenu</p>
        </div>

        <!-- Editable trigger -->
        <UButton v-else icon="i-lucide-file-text" :label="buttonLabel" variant="outline" class="w-full justify-start"
            @click="openEditor" />

        <!-- Modal -->
        <UModal v-model:open="isOpen" fullscreen :close="{ color: 'neutral', variant: 'ghost' }">
            <template #header>
                <!-- Header -->
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                            <UIcon name="i-heroicons-chat-bubble-left-right" class="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-highlighted">Éditeur de proposition</h3>
                            <p class="text-sm text-muted">Décrivez votre proposition...</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <UButton v-if="!props.readonly" :loading="proposalStore.formLoading" @click="save">Sauvegarder
                        </UButton>
                    </div>
                </div>

            </template>
            <template #body>
                <div class="h-full flex flex-col">


                    <!-- Editor -->
                    <div class="flex-1 p-8">
                        <div class="max-w-4xl mx-auto">
                            <NotionEditor v-model="blocks" :readonly="props.readonly"
                                :proposal-id="currentProposalId" />
                        </div>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script lang="ts" setup>
import type { NotionBlock } from '~/types/notion';
import NotionEditor from './NotionEditor.vue';

interface Props {
    contentJson?: NotionBlock[] | null;
    readonly?: boolean;
    projectId?: string;
}

interface Emits {
    (e: 'update:content_json', value: NotionBlock[]): void;
    (e: 'update:content_html', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    contentJson: null,
    readonly: false,
    projectId: undefined,
});

const emit = defineEmits<Emits>();

const isOpen = ref(false);
const editor = useNotionEditor();
const proposalStore = useProposalStore();

// Blocks state
const blocks = ref<NotionBlock[]>([]);

// Initialize blocks
watchEffect(() => {
    if (props.contentJson?.length) {
        blocks.value = [...props.contentJson];
    } else {
        // Default blocks for new proposals
        blocks.value = [
            {
                id: `block_${Date.now()}`,
                type: 'heading1',
                content: 'Proposition Commerciale',
                order: 1
            },
            {
                id: `block_${Date.now() + 1}`,
                type: 'paragraph',
                content: 'Décrivez votre proposition...',
                order: 2
            }
        ];
    }
});

// Button label
const buttonLabel = computed(() => {
    const heading = blocks.value.find(b => b.type.startsWith('heading'))?.content;
    return heading && heading !== 'Proposition Commerciale'
        ? heading.slice(0, 50) + (heading.length > 50 ? '...' : '')
        : 'Créer le contenu de la proposition';
});

// Current proposal ID for image uploads
const currentProposalId = computed(() => {
    const proposalId = unref(proposalStore.proposal)?.id;
    return proposalId || props.projectId;
});

// HTML content for readonly
const htmlContent = computed(() => {
    editor.initialize(blocks.value);
    return editor.getHtml();
});

// Open editor and create draft proposal if needed
const openEditor = async () => {
    // If no existing content and projectId provided, create draft proposal
    if (!props.contentJson?.length && props.projectId && !proposalStore.exists) {
        try {
            const defaultBlocks = [
                {
                    id: `block_${Date.now()}`,
                    type: 'heading1' as const,
                    content: 'Proposition Commerciale',
                    order: 1
                },
                {
                    id: `block_${Date.now() + 1}`,
                    type: 'paragraph' as const,
                    content: 'Décrivez votre proposition...',
                    order: 2
                }
            ];

            // Create draft proposal
            await proposalStore.createProposal(
                props.projectId,
                {
                    content_json: defaultBlocks,
                    content_html: '',
                    price: 0,
                    deposit_required: false,
                    deposit_amount: null,
                    contract_url: null,
                    quote_url: null,
                },
                { payment_method: null },
                true // isProjectFree for now
            );

            // Update local blocks
            blocks.value = [...defaultBlocks];
        } catch (error) {
            console.error('Erreur création proposition:', error);
            useToast().add({
                title: 'Erreur',
                description: 'Impossible de créer la proposition',
                color: 'error'
            });
            return;
        }
    }

    isOpen.value = true;
};

// Save
const save = async () => {
    try {
        const proposalId = unref(proposalStore.proposal)?.id;

        if (proposalId) {
            // Update proposal content in database with optimistic update
            await proposalStore.updateProposalContent(
                proposalId,
                [...blocks.value],
                htmlContent.value
            );
        }

        // Emit for local state sync
        emit('update:content_json', [...blocks.value]);
        emit('update:content_html', htmlContent.value);

        isOpen.value = false;

        useToast().add({
            title: 'Contenu sauvegardé',
            color: 'success'
        });
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        useToast().add({
            title: 'Erreur de sauvegarde',
            description: 'Impossible de sauvegarder le contenu',
            color: 'error'
        });
    }
};
</script>