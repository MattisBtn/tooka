<template>
  <div class="container mx-auto p-4">
    <PageHeader badge="Clients" badge-color="primary" badge-variant="soft" badge-icon="i-heroicons-users"
      title="Gestion des clients" subtitle="Ajoutez, modifiez ou supprimez des clients de votre entreprise" separator>
      <template #actions>
        <USelectMenu :model-value="store.typeFilter" :items="store.typeOptions" value-key="value"
          placeholder="Filtrer par type" class="mr-2" @update:model-value="store.setTypeFilter" />
        <UInput :model-value="store.searchQuery" icon="i-lucide-search" placeholder="Rechercher..." class="mr-2"
          @update:model-value="store.setSearchQuery" />
        <UButton icon="i-lucide-plus" color="primary" size="lg" label="Nouveau client" @click="store.openCreateModal" />
      </template>
    </PageHeader>

    <div ref="tableContainer" class="mt-6">
      <UTable ref="table" :columns="columns" :data="store.filteredClients" sticky :loading="store.isLoading"
        :empty-state="{ icon: 'i-lucide-users', label: 'Aucun client trouvé' }" />
    </div>

    <!-- Pagination -->
    <div v-if="store.totalPages > 1" class="mt-6 flex justify-center">
      <UPagination v-model:page="store.currentPage" :total="store.totalItems" :items-per-page="20"
        @update:page="handlePageChange" />
    </div>

    <!-- Client Modal -->
    <ClientModal :model-value="store.showModal" :client="store.selectedClient" @update:model-value="store.closeModal" />

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
import type { Client } from '~/types/client'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdown = resolveComponent('UDropdownMenu')

// Store
const store = useClientsStore()

// Initialize store
onMounted(async () => {
  await store.initialize()
})

const columns: TableColumn<Client>[] = [
  {
    accessorKey: 'client',
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

// Event handlers
const handlePageChange = async (page: number) => {
  await store.setPage(page)
}

const confirmDelete = async () => {
  if (!store.clientToDelete) return

  try {
    await store.deleteClient(store.clientToDelete.id)
  } catch (error) {
    console.error('Error deleting client:', error)
  }
}
</script>

<style></style>