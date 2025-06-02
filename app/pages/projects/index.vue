<template>
  <div class="container mx-auto p-4">
    <PageHeader badge="Projets" badge-color="primary" badge-variant="soft" badge-icon="i-heroicons-folder"
      title="Gestion des projets" subtitle="Créez, gérez et suivez vos projets clients" separator>
      <template #actions>
        <USelectMenu v-model="statusFilter" :items="statusOptions" value-key="value" placeholder="Filtrer par statut"
          class="mr-2" @update:model-value="handleStatusFilter" />
        <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Rechercher..." class="mr-2"
          @update:model-value="handleSearch" />
        <UButton icon="i-lucide-plus" color="primary" size="lg" label="Nouveau projet" @click="openCreateModal" />
      </template>
    </PageHeader>

    <div ref="tableContainer" class="mt-6">
      <UTable ref="table" :columns="columns" :data="tableRows" sticky
        :loading="projectStore.loading.value ? true : false"
        :empty-state="{ icon: 'i-lucide-folder', label: 'Aucun projet trouvé' }" class="w-full h-[calc(100vh-200px)]" />
    </div>

    <!-- Project Modal -->
    <ProjectModal v-model="showModal" :project="selectedProject" @project-saved="handleProjectSaved" />

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal" :title="deleteModalTitle" :description="deleteModalDescription">
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton color="neutral" variant="ghost" label="Annuler" :disabled="deletionLoading" @click="cancelDelete" />
          <UButton color="error" label="Supprimer définitivement" :loading="deletionLoading" @click="confirmDelete" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import { useInfiniteScroll } from '@vueuse/core'
import { h, resolveComponent } from 'vue'
import { useProjects } from '~/composables/projects/useProjects'
import type { ProjectWithClient } from '~/types/project'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const searchQuery = ref('')
const statusFilter = ref<"draft" | "in_progress" | "completed" | null>(null)
const searchTimeout = ref<NodeJS.Timeout | null>(null)
const projectStore = useProjects()
const tableContainer = ref<HTMLElement | null>(null)
const table = ref<ComponentPublicInstance | null>(null)

// Modal states
const showModal = ref(false)
const selectedProject = ref<ProjectWithClient | undefined>(undefined)

// Delete confirmation modal state
const showDeleteModal = ref(false)
const projectToDelete = ref<ProjectWithClient | null>(null)
const deletionLoading = ref(false)

// Status filter options
const statusOptions = computed(() => [
  { value: null, label: 'Tous les statuts' },
  ...projectStore.getStatusOptions().map(option => ({
    value: option.value,
    label: option.label
  }))
])

const columns: TableColumn<ProjectWithClient>[] = [
  {
    accessorKey: 'title',
    header: 'Titre',
    cell: ({ row }) => {
      return h('div', { class: 'font-medium' }, row.original.title)
    }
  },
  {
    accessorKey: 'client',
    header: 'Client',
    cell: ({ row }) => {
      const client = row.original.client
      if (!client) return 'Client supprimé'

      return client.type === 'individual'
        ? `${client.first_name || ''} ${client.last_name || ''}`.trim()
        : client.company_name || ''
    }
  },
  {
    accessorKey: 'initial_price',
    header: 'Prix initial',
    cell: ({ row }) => {
      const price = row.original.initial_price
      return price
        ? new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(price)
        : 'Non défini'
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Date de création',
    cell: ({ row }) => {
      const date = row.original.created_at
      return date
        ? new Intl.DateTimeFormat('fr-FR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(new Date(date))
        : ''
    }
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const status = row.original.status
      const statusOption = projectStore.getStatusOptions().find(s => s.value === status)

      return h(UBadge, {
        color: statusOption?.color || 'gray',
        variant: 'subtle',
        class: 'capitalize'
      }, () => statusOption?.label || status)
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'flex items-center gap-2' },
        [
          h(UButton, {
            icon: 'i-lucide-eye',
            size: 'sm',
            color: 'primary',
            variant: 'ghost',
            title: 'Voir',
            onClick: () => viewProject(row.original)
          }),
          h(UButton, {
            icon: 'i-lucide-edit',
            size: 'sm',
            color: 'primary',
            variant: 'ghost',
            title: 'Modifier',
            onClick: () => openEditModal(row.original)
          }),
          h(UButton, {
            icon: 'i-lucide-trash',
            size: 'sm',
            color: 'error',
            variant: 'ghost',
            title: 'Supprimer',
            disabled: row.original.status !== 'draft',
            onClick: () => openDeleteModal(row.original)
          })
        ]
      )
    }
  }
]

// Compute table rows with formatted data
const tableRows = computed(() => projectStore.projects.value as ProjectWithClient[])

// Computed properties for delete modal
const deleteModalTitle = computed(() => 'Supprimer le projet')

const deleteModalDescription = computed(() => {
  if (!projectToDelete.value) return ''

  return `Êtes-vous sûr de vouloir supprimer le projet "${projectToDelete.value.title}" ? Cette action est irréversible.`
})

// Modal methods
const openCreateModal = () => {
  selectedProject.value = undefined
  showModal.value = true
}

const openEditModal = (project: ProjectWithClient) => {
  selectedProject.value = project
  showModal.value = true
}

const viewProject = (project: ProjectWithClient) => {
  // Navigate to project detail page
  navigateTo(`/projects/${project.id}`)
}

const handleProjectSaved = (project: ProjectWithClient) => {
  if (selectedProject.value) {
    // Update existing project in list
    projectStore.updateProjectInList(project)
  } else {
    // Add new project to list
    projectStore.addProjectToList(project)
  }
  showModal.value = false
  selectedProject.value = undefined
}

// Delete modal methods
const openDeleteModal = (project: ProjectWithClient) => {
  projectToDelete.value = project
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  projectToDelete.value = null
  deletionLoading.value = false
}

const confirmDelete = async () => {
  if (!projectToDelete.value) return

  deletionLoading.value = true

  try {
    await projectStore.deleteProject(projectToDelete.value.id)
    showDeleteModal.value = false
    projectToDelete.value = null
  } catch (error) {
    console.error('Error deleting project:', error)
  } finally {
    deletionLoading.value = false
  }
}

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(async () => {
    const filters = {
      search: searchQuery.value.trim() || undefined,
      status: statusFilter.value || undefined
    }

    await projectStore.refresh(filters)
  }, 300)
}

const handleStatusFilter = async () => {
  const filters = {
    search: searchQuery.value.trim() || undefined,
    status: statusFilter.value || undefined
  }

  await projectStore.refresh(filters)
}

onMounted(async () => {
  await projectStore.initialLoad()

  useInfiniteScroll(
    table.value?.$el,
    async () => {
      if (projectStore.hasMore.value && !projectStore.loading.value) {
        await projectStore.loadMore()
      }
    },
    {
      distance: 200,
      canLoadMore: () => {
        return !projectStore.loading.value && projectStore.hasMore.value
      }
    }
  )
})
</script>

<style></style>