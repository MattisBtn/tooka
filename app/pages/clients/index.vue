<template>
  <div class="container mx-auto p-4">
    <PageHeader badge="Clients" badge-color="primary" badge-variant="soft" badge-icon="i-heroicons-users"
      title="Gestion des clients" subtitle="Ajoutez, modifiez ou supprimez des clients de votre entreprise" separator>
      <template #actions>
        <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Rechercher..." class="mr-2"
          @update:model-value="handleSearch" />
        <UButton icon="i-lucide-plus" color="primary" size="lg" label="Nouveau client" />
      </template>
    </PageHeader>

    <div ref="tableContainer" class="mt-6">
      <UTable :columns="columns" :rows="clientStore.clients" sticky :loading="clientStore.loading ? true : undefined"
        :empty-state="{ icon: 'i-lucide-users', label: 'Aucun client trouvé' }" class="w-full" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import { useInfiniteScroll } from '@vueuse/core'
import { useClients, type Client } from '~/composables/useClients'

const searchQuery = ref('')
const searchTimeout = ref<NodeJS.Timeout | null>(null)
const clientStore = useClients()
const tableContainer = ref<HTMLElement | null>(null)

const columns: TableColumn<Client>[] = [
  {
    accessorKey: 'client',
    header: 'Client',
  },
  {
    accessorKey: 'type',
    header: 'Type',
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
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
  }
]

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
    if (clientStore.hasMore && !clientStore.loading) {
      await clientStore.loadMore({
        search: searchQuery.value.trim() || undefined
      })
    }
  },
  { distance: 100 }
)
</script>

<style></style>