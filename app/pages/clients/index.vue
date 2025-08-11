<template>
  <div class="container mx-auto p-4">
    <PageHeader badge="Clients" badge-color="info" badge-variant="soft" badge-icon="i-heroicons-users"
      title="Gestion des clients" subtitle="Ajoutez, modifiez ou supprimez des clients de votre entreprise" separator>
      <template #actions>
        <UButton icon="i-lucide-plus" color="primary" size="lg" label="Nouveau client" @click="store.openCreateModal" />
      </template>
    </PageHeader>

    <!-- Filters and Search Bar -->
    <div class="mt-6 p-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <UInput :model-value="store.searchQuery" icon="i-lucide-search" placeholder="Rechercher un client..."
          class="flex-1" @update:model-value="store.setSearchQuery" />
        <USelectMenu :model-value="store.typeFilter" :items="store.typeOptions" value-key="value"
          placeholder="Filtrer par type" class="w-48" @update:model-value="store.setTypeFilter" />
        <UDropdownMenu :items="sortOptions" :popper="{ placement: 'bottom-end' }">
          <UButton icon="i-lucide-arrow-up-down" color="neutral" variant="outline" size="lg" label="Ordre de tri" />
        </UDropdownMenu>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <div v-if="selectedClientsCount > 0"
      class="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-check-circle" class="text-gray-500 dark:text-gray-400" />
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ selectedClientsCount }} client(s) sélectionné(s)
          </span>
        </div>
        <UButton icon="i-lucide-trash-2" color="error" variant="soft" size="sm" label="Supprimer la sélection"
          @click="handleBulkDelete" />
      </div>
    </div>

    <div ref="tableContainer" class="mt-6">
      <UTable ref="table" v-model:row-selection="rowSelection" :columns="columns" :data="store.filteredClients" sticky
        :loading="store.isLoading" empty="Aucun client trouvé"
        :ui="{ thead: 'bg-transparent backdrop-blur-none', th: 'bg-transparent' }" :get-row-id="(row) => row.id" />
    </div>

    <!-- Pagination -->
    <div v-if="store.totalPages > 1" class="mt-6 flex justify-center">
      <UPagination v-model:page="store.currentPage" :total="store.totalItems" :items-per-page="20"
        @update:page="handlePageChange" />
    </div>

    <!-- Client Modal -->
    <ClientModal :model-value="store.showModal" :client="store.selectedClient" @update:model-value="store.closeModal" />

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
import type { Client } from '~/types/client'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdown = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

// Store
const store = useClientsStore()

// Row selection
const rowSelection = ref({})

// Computed properties for bulk actions
const selectedClientsCount = computed(() => Object.keys(rowSelection.value).length)

const selectedClients = computed(() => {
  const selectedIds = Object.keys(rowSelection.value)
  return store.clients.filter(client => selectedIds.includes(client.id))
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

const columns: TableColumn<Client>[] = [
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
    id: 'client',
    header: 'Client',
    cell: ({ row }) => {
      const client = row.original
      return client.type === 'individual'
        ? `${client.first_name || ''} ${client.last_name || ''}`.trim()
        : client.company_name || ''
    }
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const isIndividual = row.original.type === 'individual'
      return h(UBadge, {
        color: isIndividual ? 'primary' : 'secondary',
        variant: 'subtle',
        class: 'capitalize'
      }, () => isIndividual ? 'Particulier' : 'Professionnel')
    }
  },
  {
    accessorKey: 'billing_city',
    header: 'Ville',
  },
  {
    accessorKey: 'billing_country',
    header: 'Pays',
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
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const items = [
        [
          {
            label: 'Modifier',
            icon: 'i-lucide-edit',
            onSelect: () => store.openEditModal(row.original)
          },
          {
            label: 'Supprimer',
            icon: 'i-lucide-trash',
            color: 'error',
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
const deleteModalTitle = computed(() => 'Supprimer le client')

const deleteModalDescription = computed(() => {
  if (!store.clientToDelete) return ''

  const clientName = store.clientToDelete.type === 'individual'
    ? `${store.clientToDelete.first_name} ${store.clientToDelete.last_name}`
    : store.clientToDelete.company_name

  return `Êtes-vous sûr de vouloir supprimer le client "${clientName}" ? Cette action est irréversible.`
})

// Computed properties for multiple delete modal
const multipleDeleteModalTitle = computed(() => `Supprimer ${selectedClientsCount.value} client(s)`)

const multipleDeleteModalDescription = computed(() => {
  if (!store.clientsToDelete.length) return ''

  const clientNames = store.clientsToDelete.map(client =>
    client.type === 'individual'
      ? `${client.first_name} ${client.last_name}`
      : client.company_name
  ).join(', ')

  return `Êtes-vous sûr de vouloir supprimer définitivement ${selectedClientsCount.value} client(s) : ${clientNames} ? Cette action est irréversible.`
})

// Event handlers
const handlePageChange = async (page: number) => {
  await store.setPage(page)
}

const confirmDelete = async () => {
  if (!store.clientToDelete) return

  try {
    const result = await store.deleteClient(store.clientToDelete.id)
    if (result?.resetSelection) {
      rowSelection.value = {}
    }
  } catch (error) {
    console.error('Error deleting client:', error)
  }
}

const handleBulkDelete = () => {
  if (selectedClients.value.length > 0) {
    store.openMultipleDeleteModal(selectedClients.value)
  }
}

const confirmMultipleDelete = async () => {
  try {
    const result = await store.deleteMultipleClients()
    if (result?.resetSelection) {
      rowSelection.value = {}
    }
  } catch (error) {
    console.error('Error deleting multiple clients:', error)
  }
}
</script>

<style></style>