<template>
  <div class="container mx-auto p-4">
    <SharedPageHeader badge="Clients" badge-color="info" badge-variant="soft" badge-icon="i-heroicons-users"
      title="Gestion des clients" subtitle="Ajoutez, modifiez ou supprimez des clients de votre entreprise" separator>
      <template #actions>
        <UButton icon="i-lucide-plus" color="primary" size="lg" label="Nouveau client" @click="store.openCreateModal" />
      </template>
    </SharedPageHeader>

    <!-- Filters and Search Bar -->
    <div class="mt-6 p-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <UInput :model-value="store.searchQuery" icon="i-lucide-search" placeholder="Rechercher un client..."
          class="flex-1" @update:model-value="store.setSearchQuery" />
        <UDropdownMenu :items="typeFilterOptions" :popper="{ placement: 'bottom-end' }">
          <UButton icon="i-lucide-filter" color="neutral" variant="outline" :label="currentTypeFilterLabel" />
        </UDropdownMenu>
        <UDropdownMenu :items="sortOptions" :popper="{ placement: 'bottom-end' }">
          <UButton icon="i-lucide-arrow-up-down" color="neutral" variant="outline" />
        </UDropdownMenu>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <div v-if="Object.keys(rowSelection).length > 0"
      class="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-check-circle" class="text-gray-500 dark:text-gray-400" />
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ Object.keys(rowSelection).length }} client(s) sélectionné(s)
          </span>
        </div>
        <UButton icon="i-lucide-trash-2" color="error" variant="soft" size="sm" label="Supprimer la sélection"
          @click="handleBulkDelete" />
      </div>
    </div>

    <div ref="tableContainer" class="mt-6">
      <UTable ref="table" v-model:row-selection="rowSelection" :columns="columns" :data="store.clients" sticky
        :loading="store.loading" empty="Aucun client trouvé"
        :ui="{ thead: 'bg-transparent backdrop-blur-none', th: 'bg-transparent' }" :get-row-id="(row) => row.id" />
    </div>

    <!-- Pagination -->
    <div v-if="store.totalPages > 1" class="mt-6 flex justify-center">
      <UPagination v-model:page="store.currentPage" :total="store.totalItems" :items-per-page="20"
        @update:page="handlePageChange" />
    </div>



    <!-- Delete Confirmation Modal -->
    <UModal :open="store.modalState.type === 'delete'" :title="deleteModalTitle" :description="deleteModalDescription">
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton color="neutral" variant="ghost" label="Annuler" :disabled="store.deletionLoading"
            @click="store.closeModal" />
          <UButton color="error" label="Supprimer définitivement" :loading="store.deletionLoading"
            @click="confirmDelete" />
        </div>
      </template>
    </UModal>

    <!-- Multiple Delete Confirmation Modal -->
    <UModal :open="store.modalState.type === 'multiple-delete'" :title="multipleDeleteModalTitle"
      :description="multipleDeleteModalDescription">
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton color="neutral" variant="ghost" label="Annuler" :disabled="store.multipleDeletionLoading"
            @click="store.closeModal" />
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

// UI Options moved from store to component
const typeFilterOptions = [
  [
    {
      label: "Tous les types",
      icon: "i-lucide-filter",
      onSelect: () => store.setTypeFilter(null)
    },
    {
      label: "Particulier",
      icon: "i-lucide-user",
      onSelect: () => store.setTypeFilter("individual")
    },
    {
      label: "Professionnel",
      icon: "i-lucide-building",
      onSelect: () => store.setTypeFilter("company")
    }
  ]
]

const sortOptions = [
  [
    {
      label: "Plus récents",
      icon: "i-lucide-calendar-days",
      onSelect: () => store.setSortOrder("created_desc")
    },
    {
      label: "Plus anciens",
      icon: "i-lucide-calendar-days",
      onSelect: () => store.setSortOrder("created_asc")
    },
    {
      label: "Nom A-Z",
      icon: "i-lucide-sort-asc",
      onSelect: () => store.setSortOrder("name_asc")
    },
    {
      label: "Nom Z-A",
      icon: "i-lucide-sort-desc",
      onSelect: () => store.setSortOrder("name_desc")
    }
  ]
]

const currentTypeFilterLabel = computed(() => {
  if (!store.typeFilter) return "Tous les types"

  return store.typeFilter === "individual" ? "Particulier" : "Professionnel"
})

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
  const client = store.modalState.data as Client
  if (!client) return ''

  const clientName = client.type === 'individual'
    ? `${client.first_name} ${client.last_name}`
    : client.company_name

  return `Êtes-vous sûr de vouloir supprimer le client "${clientName}" ? Cette action est irréversible.`
})

// Computed properties for multiple delete modal
const multipleDeleteModalTitle = computed(() => {
  const clients = store.modalState.data as Client[]
  return `Supprimer ${clients?.length || 0} client(s)`
})

const multipleDeleteModalDescription = computed(() => {
  const clients = store.modalState.data as Client[]
  if (!clients?.length) return ''

  const clientNames = clients.map(client =>
    client.type === 'individual'
      ? `${client.first_name} ${client.last_name}`
      : client.company_name
  ).join(', ')

  return `Êtes-vous sûr de vouloir supprimer définitivement ${clients.length} client(s) : ${clientNames} ? Cette action est irréversible.`
})

// Event handlers
const handlePageChange = async (page: number) => {
  await store.setPage(page)
}

const confirmDelete = async () => {
  const client = store.modalState.data as Client
  if (!client) return

  const result = await store.deleteClient(client.id)
  if (result?.resetSelection) {
    rowSelection.value = {}
  }
}

const handleBulkDelete = () => {
  const selectedIds = Object.keys(rowSelection.value)
  const selectedClients = store.clients.filter(client => selectedIds.includes(client.id))

  if (selectedClients.length > 0) {
    store.openMultipleDeleteModal(selectedClients)
  }
}

const confirmMultipleDelete = async () => {
  const result = await store.deleteMultipleClients()
  if (result?.resetSelection) {
    rowSelection.value = {}
  }
}
</script>

<style></style>