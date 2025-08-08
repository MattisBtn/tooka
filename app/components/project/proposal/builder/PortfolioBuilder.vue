<template>
    <div class="space-y-4">
        <UAlert :color="alertColor" variant="soft" icon="i-lucide-images" :title="alertTitle"
            :description="alertDescription" />

        <div class="grid grid-cols-2 gap-3">
            <UFileUpload v-model="selectedFiles" accept=".jpg,.jpeg,.png,.webp" multiple :max-files="6"
                :max-size="5 * 1024 * 1024" class="col-span-2" @update:model-value="onFilesSelected" />
        </div>

        <div class="grid grid-cols-2 gap-3">
            <div v-for="(it, idx) in component.items" :key="idx"
                class="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                <img :src="it.previewUrl || it.url" alt="" class="w-full aspect-square object-cover">
                <div class="p-2 space-y-2">
                    <UFormField label="Titre" :name="`title-${idx}`">
                        <UInput :model-value="it.title || ''" placeholder="Ex: Shooting bijoux – marque X"
                            @input="updateItem(idx, { title: $event.target.value || undefined })" />
                    </UFormField>
                    <UFormField label="Catégorie" :name="`category-${idx}`">
                        <UInput :model-value="it.category || ''" placeholder="Ex: Bijoux"
                            @input="updateItem(idx, { category: $event.target.value || undefined })" />
                    </UFormField>
                    <div class="flex justify-between items-center">
                        <UButton icon="i-lucide-arrow-left-right" size="xs" variant="ghost" color="neutral"
                            :disabled="idx === 0" @click="move(idx, -1)" />
                        <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error"
                            @click="removeItem(idx)" />
                        <UButton icon="i-lucide-arrow-left-right" size="xs" variant="ghost" color="neutral"
                            :disabled="idx === component.items.length - 1" @click="move(idx, 1)" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { PortfolioComponent } from '~/composables/proposals/useProposalComponentTypes';

interface Props { component: PortfolioComponent }
interface Emits {
    (e: 'update', updates: { portfolioItems?: PortfolioComponent['items'] }): void
    (e: 'removed-paths', paths: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedFiles = ref<File[]>([])

// Computed properties for dynamic alert
const alertColor = computed(() => {
    const count = props.component.items.length
    if (count < 4) return 'warning'
    if (count >= 4 && count <= 6) return 'success'
    return 'error'
})

const alertTitle = computed(() => {
    const count = props.component.items.length
    if (count < 4) return `Mini galerie (${count}/4-6 visuels)`
    if (count >= 4 && count <= 6) return `Mini galerie (${count}/6 visuels)`
    return `Trop d'images (${count}/6)`
})

const alertDescription = computed(() => {
    const count = props.component.items.length
    if (count < 4) return `Ajoutez au moins ${4 - count} image(s) pour rassurer le client.`
    if (count >= 4 && count <= 6) return 'Ajoutez des images pertinentes pour rassurer le client.'
    return 'Supprimez des images pour respecter la limite de 6.'
})

const onFilesSelected = async (files: unknown) => {
    const fileArray = files as File[]
    if (!fileArray || fileArray.length === 0) return

    // Validate file types and sizes
    const validFiles = fileArray.filter(file => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        const maxSize = 5 * 1024 * 1024 // 5MB

        if (!validTypes.includes(file.type)) {
            console.warn(`Fichier ignoré: ${file.name} (type non supporté)`)
            return false
        }

        if (file.size > maxSize) {
            console.warn(`Fichier ignoré: ${file.name} (trop volumineux: ${(file.size / 1024 / 1024).toFixed(1)}MB)`)
            return false
        }

        return true
    })

    if (validFiles.length === 0) return

    const previews = await Promise.all(validFiles.map(async (file) => ({
        ...(await fileToPreview(file)),
        title: undefined,
        category: undefined,
    })))

    const next = [...props.component.items, ...previews].slice(0, 6)
    emit('update', { portfolioItems: next })
    selectedFiles.value = []
}

const updateItem = (idx: number, partial: Partial<{ title?: string; category?: string }>) => {
    const next = props.component.items.map((it, i) => i === idx ? { ...it, ...partial } : it)
    emit('update', { portfolioItems: next })
}

const removeItem = (idx: number) => {
    const removed = props.component.items[idx]
    const next = props.component.items.filter((_, i) => i !== idx)
    emit('update', { portfolioItems: next })
    if (removed?.path) emit('removed-paths', [removed.path])
}

const move = (idx: number, delta: number) => {
    const arr = [...props.component.items]
    const target = idx + delta
    if (target < 0 || target >= arr.length) return
    const temp = arr[idx]!
    arr[idx] = arr[target]!
    arr[target] = temp
    emit('update', { portfolioItems: arr })
}

const fileToPreview = (file: File) => new Promise<{ previewUrl: string; url?: string; path?: string; title?: string; category?: string }>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ previewUrl: String(reader.result) })
    reader.readAsDataURL(file)
})
</script>
