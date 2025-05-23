<template>
    <UModal v-model:open="isOpen" :title="modalTitle" :close="{ color: 'neutral', variant: 'ghost' }">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <UIcon :name="client ? 'i-lucide-edit' : 'i-lucide-plus'" class="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-highlighted">{{ modalTitle }}</h3>
                    <p class="text-sm text-muted">
                        {{ client ? 'Modifiez les informations du client' : 'Ajoutez un nouveau client à votre base' }}
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <ClientForm :client="client" @client-saved="handleClientSaved" @cancel="closeModal" />
        </template>
    </UModal>
</template>

<script setup lang="ts">
import type { Client } from "~/types/client";

interface Props {
    modelValue: boolean;
    client?: Client;
}

interface Emits {
    (e: "update:modelValue", value: boolean): void;
    (e: "clientSaved", client: Client): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Computed properties
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

const modalTitle = computed(() =>
    props.client ? "Modifier le client" : "Nouveau client"
);

// Handle client saved from form
const handleClientSaved = (client: Client) => {
    emit("clientSaved", client);
    closeModal();
};

// Methods
const closeModal = () => {
    isOpen.value = false;
};

// Handle escape key
onKeyStroke("Escape", (e) => {
    if (isOpen.value) {
        e.preventDefault();
        closeModal();
    }
});
</script>