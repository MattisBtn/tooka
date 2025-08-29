<template>
    <UModal v-model:open="isOpen" :title="modalTitle" :close="{ color: 'neutral', variant: 'ghost' }"
        :ui="{ content: 'w-[calc(100vw-2rem)] max-w-4xl' }">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <UIcon :name="project ? 'i-lucide-edit' : 'i-lucide-plus'" class="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-highlighted">{{ modalTitle }}</h3>
                    <p class="text-sm text-muted">
                        {{ project ? 'Modifiez les informations du projet' : 'Créez un nouveau projet pour votre client'
                        }}
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <ProjectForm :project="project" @cancel="handleCancel" @success="handleSuccess"
                @create-client="handleCreateClient" />

            <!-- Nested Client Modal -->
            <ClientModal
                :model-value="clientStore.modalState.type === 'create' || clientStore.modalState.type === 'edit'"
                :client="clientStore.modalState.type === 'edit' ? (clientStore.modalState.data as Client) : undefined"
                @update:model-value="clientStore.closeModal" @success="handleClientSuccess"
                @cancel="handleClientCancel" />
        </template>
    </UModal>
</template>

<script lang="ts" setup>
import type { Client } from '~/types/client';
import type { ProjectWithClient } from '~/types/project';

interface Props {
    modelValue: boolean
    project?: ProjectWithClient
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success', project: ProjectWithClient): void
    (e: 'create-client'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Store
const clientStore = useClientsStore()



// Computed properties
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const modalTitle = computed(() =>
    props.project ? 'Modifier le projet' : 'Nouveau projet'
)

// Handle form events
const handleCancel = () => {
    isOpen.value = false
}

const handleSuccess = (project: ProjectWithClient) => {
    isOpen.value = false
    emit('success', project)
}

const handleCreateClient = () => {
    // Ouvrir la modal client sans fermer la modal projet
    emit('create-client')
}

const handleClientSuccess = (_client: Client) => {
    // Le client a été créé, la modal projet reste ouverte avec le state préservé
}

const handleClientCancel = () => {
    // L'utilisateur a annulé la création du client
    // La modal projet reste ouverte avec le state préservé
}

// Handle escape key
onKeyStroke('Escape', (e) => {
    if (isOpen.value) {
        e.preventDefault()
        isOpen.value = false
    }
})
</script>