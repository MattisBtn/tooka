<template>
  <div class="container mx-auto p-4">
    <PageHeader badge="Projets" badge-color="primary" badge-variant="soft" badge-icon="i-heroicons-folder"
      title="Gestion des projets" subtitle="Créez, gérez et suivez vos projets clients" separator>
      <template #actions>
        <USelectMenu :model-value="store.statusFilter" :items="store.statusOptions" value-key="value"
          placeholder="Filtrer par statut" class="mr-2" @update:model-value="store.setStatusFilter" />
        <UInput :model-value="store.searchQuery" icon="i-lucide-search" placeholder="Rechercher..." class="mr-2"
          @update:model-value="store.setSearchQuery" />
        <UButton icon="i-lucide-plus" size="lg" label="Nouveau projet" @click="store.openCreateModal" />
      </template>
    </PageHeader>

    <div ref="tableContainer" class="mt-6">
      <UTable ref="table" :columns="columns" :data="store.filteredProjects" sticky :loading="store.isLoading"
        :empty-state="{ icon: 'i-lucide-folder', label: 'Aucun projet trouvé' }" />
    </div>

    <!-- Pagination -->
    <div v-if="store.totalPages > 1" class="mt-6 flex justify-center">
      <UPagination v-model:page="store.currentPage" :total="store.totalItems" :items-per-page="20"
        @update:page="handlePageChange" />
    </div>



    <!-- Project Modal -->
    <ProjectModal :model-value="store.showModal" :project="store.selectedProject" @update:model-value="store.closeModal"
      @project-saved="handleProjectSaved" />

    <!-- Delete Confirmation Modal -->
    <UModal :open="store.showDeleteModal" :title="deleteModalTitle" :description="deleteModalDescription">
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton color="neutral" variant="ghost" label="Annuler" :disabled="store.deletionLoading"
            @click="store.closeDeleteModal" />
          <UButton color="error" label="Supprimer définitivement" :loading="store.deletionLoading"
            @click="confirmDelete" />
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

// Store
const store = useProjectsStore()

// Initialize store
onMounted(async () => {
  await store.initialize()
})

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
      return h(
        'div',
        { class: 'flex items-center gap-2' },
        [
          h(UButton, {
            icon: 'i-lucide-settings',
            size: 'sm',
            color: 'primary',
            variant: 'ghost',
            title: 'Configurer',
            onClick: () => store.viewProject(row.original.id)
          }),
          h(UButton, {
            icon: 'i-lucide-trash',
            size: 'sm',
            color: 'error',
            variant: 'ghost',
            title: 'Supprimer',
            disabled: row.original.status !== 'draft',
            onClick: () => store.openDeleteModal(row.original)
          })
        ]
      )
    }
  }
]

// Computed properties for delete modal
const deleteModalTitle = computed(() => 'Supprimer le projet')

const deleteModalDescription = computed(() => {
  if (!store.projectToDelete) return ''

  return `Êtes-vous sûr de vouloir supprimer le projet "${store.projectToDelete.title}" ? Cette action est irréversible.`
})

// Event handlers
const handlePageChange = async (page: number) => {
  await store.setPage(page)
}

const handleProjectSaved = (project: ProjectWithClient) => {
  if (store.selectedProject) {
    store.updateProjectInList(project)
  } else {
    store.addProjectToList(project)
  }
}



const confirmDelete = async () => {
  if (!store.projectToDelete) return

  try {
    await store.deleteProject(store.projectToDelete.id)
  } catch (error) {
    console.error('Error deleting project:', error)
  }
}
</script>

<style></style>