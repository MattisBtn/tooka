<template>
  <div class="container mx-auto p-4">
    <PageHeader badge="Clients" badge-color="primary" badge-variant="soft" badge-icon="i-heroicons-users"
      title="Gestion des clients" subtitle="Ajoutez, modifiez ou supprimez des clients de votre entreprise" separator>
      <template #actions>
        <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Rechercher..." class="mr-2"
          @update:model-value="handleSearch" />
        <UButton icon="i-lucide-plus" color="primary" size="lg" label="Nouveau client" @click="openCreateModal" />
      </template>
    </PageHeader>

    <div ref="tableContainer" class="mt-6">
      <UTable :columns="columns" :data="tableRows" sticky :loading="clientStore.loading.value ? true : false"
        :empty-state="{ icon: 'i-lucide-users', label: 'Aucun client trouvé' }" class="w-full" />
    </div>

    <!-- Client Modal -->
    <ClientModal v-model="showModal" :client="selectedClient" @client-saved="handleClientSaved" />

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
import type { Client } from '~/types/client'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const searchQuery = ref('')
const searchTimeout = ref<NodeJS.Timeout | null>(null)
const clientStore = useClients()
const tableContainer = ref<HTMLElement | null>(null)

// Modal states
const showModal = ref(false)
const selectedClient = ref<Client | undefined>(undefined)

// Delete confirmation modal state
const showDeleteModal = ref(false)
const clientToDelete = ref<Client | null>(null)
const deletionLoading = ref(false)

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
      return h(
        'div',
        { class: 'flex items-center gap-2' },
        [
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
            onClick: () => openDeleteModal(row.original)
          })
        ]
      )
    }
  }
]

// Compute table rows with formatted data
const tableRows = computed(() => clientStore.clients.value as Client[])

// Computed properties for delete modal
const deleteModalTitle = computed(() => 'Supprimer le client')

const deleteModalDescription = computed(() => {
  if (!clientToDelete.value) return ''

  const clientName = clientToDelete.value.type === 'individual'
    ? `${clientToDelete.value.first_name} ${clientToDelete.value.last_name}`
    : clientToDelete.value.company_name

  return `Êtes-vous sûr de vouloir supprimer le client "${clientName}" ? Cette action est irréversible.`
})

// Modal methods
const openCreateModal = () => {
  selectedClient.value = undefined
  showModal.value = true
}

const openEditModal = (client: Client) => {
  selectedClient.value = client
  showModal.value = true
}

const handleClientSaved = (client: Client) => {
  if (selectedClient.value) {
    // Update existing client in list
    clientStore.updateClientInList(client)
  } else {
    // Add new client to list
    clientStore.addClientToList(client)
  }
  showModal.value = false
  selectedClient.value = undefined
}

// Delete modal methods
const openDeleteModal = (client: Client) => {
  clientToDelete.value = client
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  clientToDelete.value = null
  deletionLoading.value = false
}

const confirmDelete = async () => {
  if (!clientToDelete.value) return

  deletionLoading.value = true

  try {
    await clientStore.deleteClient(clientToDelete.value.id)
    showDeleteModal.value = false
    clientToDelete.value = null
  } catch (error) {
    console.error('Error deleting client:', error)
  } finally {
    deletionLoading.value = false
  }
}

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(() => {
    clientStore.reset()
    clientStore.fetchClients({
      search: searchQuery.value.trim() || undefined
    })
  }, 300)
}

onMounted(() => {
  clientStore.fetchClients()
})

useInfiniteScroll(
  tableContainer,
  async () => {
    if (clientStore.hasMore.value && !clientStore.loading.value) {
      await clientStore.loadMore({
        search: searchQuery.value.trim() || undefined
      })
    }
  },
  { distance: 100 }
)
</script>

<style></style>