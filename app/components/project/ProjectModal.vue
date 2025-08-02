<template>
    <UModal v-model:open="isOpen" :title="modalTitle" :close="{ color: 'neutral', variant: 'ghost' }">
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
            <ProjectForm :project="project" @project-saved="handleProjectSaved" @cancel="store.closeModal" />
        </template>
    </UModal>
</template>

<script lang="ts" setup>
import type { ProjectWithClient } from '~/types/project'

interface Props {
    modelValue: boolean
    project?: ProjectWithClient
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'project-saved', project: ProjectWithClient): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Store
const store = useProjectsStore()

// Computed properties
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const modalTitle = computed(() =>
    props.project ? 'Modifier le projet' : 'Nouveau projet'
)

// Handle project saved from form
const handleProjectSaved = (project: ProjectWithClient) => {
    emit('project-saved', project)
    // La fermeture est gérée par le store dans createProject/updateProject
}

// Handle escape key
onKeyStroke('Escape', (e) => {
    if (isOpen.value) {
        e.preventDefault()
        store.closeModal()
    }
})
</script>