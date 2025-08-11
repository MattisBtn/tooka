<template>
  <div class="container mx-auto p-4">
    <PageHeader badge="Projets" badge-color="info" badge-variant="soft" badge-icon="i-heroicons-folder"
      title="Gestion des projets" subtitle="Créez, gérez et suivez vos projets clients" separator>
      <template #actions>
        <UButton icon="i-lucide-plus" size="lg" label="Nouveau projet" @click="store.openCreateModal" />
      </template>
    </PageHeader>

    <!-- Filters and Search Bar -->
    <div class="mt-6 p-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <UInput :model-value="store.searchQuery" icon="i-lucide-search" placeholder="Rechercher un projet..."
          class="flex-1" @update:model-value="store.setSearchQuery" />
        <USelectMenu :model-value="store.statusFilter" :items="store.statusOptions" value-key="value"
          placeholder="Filtrer par statut" class="w-48" @update:model-value="store.setStatusFilter" />
        <UDropdownMenu :items="sortOptions" :popper="{ placement: 'bottom-end' }">
          <UButton icon="i-lucide-arrow-up-down" color="neutral" variant="outline" size="lg" label="Ordre de tri" />
        </UDropdownMenu>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <div v-if="selectedProjectsCount > 0"
      class="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-check-circle" class="text-gray-500 dark:text-gray-400" />
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ selectedProjectsCount }} projet(s) sélectionné(s)
          </span>
        </div>
        <UButton icon="i-lucide-trash-2" color="error" variant="soft" size="sm" label="Supprimer la sélection"
          @click="handleBulkDelete" />
      </div>
    </div>

    <div ref="tableContainer" class="mt-6">
      <UTable ref="table" v-model:row-selection="rowSelection" :columns="columns" :data="store.filteredProjects" sticky
        :loading="store.isLoading" empty="Aucun projet trouvé"
        :ui="{ thead: 'bg-transparent backdrop-blur-none', th: 'bg-transparent' }" :get-row-id="(row) => row.id" />
    </div>

    <!-- Pagination -->
    <div v-if="store.totalPages > 1" class="mt-6 flex justify-center">
      <UPagination v-model:page="store.currentPage" :total="store.totalItems" :items-per-page="20"
        @update:page="handlePageChange" />
    </div>



    <!-- Project Modal -->
    <ProjectModal :model-value="store.showModal" :project="store.selectedProject"
      @update:model-value="store.closeModal" />

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="store.showDeleteModal" :title="deleteModalTitle" :description="deleteModalDescription">
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton color="neutral" variant="ghost" label="Annuler" :disabled="store.deletionLoading"
            @click="store.closeDeleteModal" />
          <UButton color="error" label="Supprimer définitivement" :loading="store.deletionLoading"
            @click="confirmDelete" />
        </div>
      </template>
    </UModal>

    <!-- Multiple Delete Confirmation Modal -->
    <UModal v-model:open="store.showMultipleDeleteModal" :title="multipleDeleteModalTitle"
      :description="multipleDeleteModalDescription">
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton color="neutral" variant="ghost" label="Annuler" :disabled="store.multipleDeletionLoading"
            @click="store.closeMultipleDeleteModal" />
          <UButton color="error" label="Supprimer définitivement" :loading="store.multipleDeletionLoading"
            @click="confirmMultipleDelete" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'
import type { ProjectWithClient } from '~/types/project'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdown = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

// Store
const store = useProjectsStore()

// Row selection
const rowSelection = ref({})

// Computed properties for bulk actions
const selectedProjectsCount = computed(() => Object.keys(rowSelection.value).length)

const selectedProjects = computed(() => {
  const selectedIds = Object.keys(rowSelection.value)
  return store.projects.filter(project => selectedIds.includes(project.id))
})

// Sort options for dropdown
const sortOptions = computed(() => [
  [
    ...store.sortOptions.map(option => ({
      label: option.label,
      icon: option.icon,
      onSelect: () => store.setSortOrder(option.value)
    }))
  ]
])

// Initialize store
onMounted(async () => {
  await store.initialize()
})

const columns: TableColumn<ProjectWithClient>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'aria-label': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'aria-label': 'Select row'
      })
  },
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
      const statusOption = store.statusOptions.find(s => s.value === status)

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
      const items = [
        [
          {
            label: 'Configurer',
            icon: 'i-lucide-settings',
            onSelect: () => store.viewProject(row.original.id)
          },
          {
            label: 'Supprimer',
            icon: 'i-lucide-trash',
            color: 'error',
            disabled: row.original.status !== 'draft',
            onSelect: () => store.openDeleteModal(row.original)
          }
        ]
      ]

      return h(UDropdown, {
        items,
      }, {
        default: () => h(UButton, {
          icon: 'i-lucide-more-vertical',
          size: 'sm',
          color: 'neutral',
          variant: 'ghost',
          'aria-label': 'Actions'
        })
      })
    }
  }
]

// Computed properties for delete modal
const deleteModalTitle = computed(() => 'Supprimer le projet')

const deleteModalDescription = computed(() => {
  if (!store.projectToDelete) return ''

  return `Êtes-vous sûr de vouloir supprimer le projet "${store.projectToDelete.title}" ? Cette action est irréversible.`
})

// Computed properties for multiple delete modal
const multipleDeleteModalTitle = computed(() => `Supprimer ${selectedProjectsCount.value} projet(s)`)

const multipleDeleteModalDescription = computed(() => {
  if (!store.projectsToDelete.length) return ''

  const projectNames = store.projectsToDelete.map(project => project.title).join(', ')

  return `Êtes-vous sûr de vouloir supprimer définitivement ${selectedProjectsCount.value} projet(s) : ${projectNames} ? Cette action est irréversible.`
})

// Event handlers
const handlePageChange = async (page: number) => {
  await store.setPage(page)
}

const confirmDelete = async () => {
  if (!store.projectToDelete) return

  try {
    const result = await store.deleteProject(store.projectToDelete.id)
    if (result?.resetSelection) {
      rowSelection.value = {}
    }
  } catch (error) {
    console.error('Error deleting project:', error)
  }
}

const handleBulkDelete = () => {
  if (selectedProjects.value.length > 0) {
    store.openMultipleDeleteModal(selectedProjects.value)
  }
}

const confirmMultipleDelete = async () => {
  try {
    const result = await store.deleteMultipleProjects()
    if (result?.resetSelection) {
      rowSelection.value = {}
    }
  } catch (error) {
    console.error('Error deleting multiple projects:', error)
  }
}
</script>

<style></style>