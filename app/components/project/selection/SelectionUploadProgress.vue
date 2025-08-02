<template>
    <UCard v-if="selectionStore.uploadProgress.isActive" variant="outline" class="border-primary/20 bg-primary/5">
        <template #header>
            <div class="flex items-center gap-3">
                <UIcon name="i-lucide-upload" class="w-5 h-5 text-primary animate-pulse" />
                <h3 class="text-sm font-semibold text-primary">Upload et conversion en cours</h3>
                <UBadge
                    :label="`${selectionStore.uploadProgress.convertedFiles}/${selectionStore.uploadProgress.totalFiles} fichiers`"
                    color="primary" variant="soft" size="sm" />
            </div>
        </template>

        <div class="space-y-4">
            <!-- Progress Bar -->
            <div class="space-y-2">
                <UProgress :model-value="selectionStore.uploadProgressPercentage" :max="100" status color="primary"
                    size="md" />
            </div>

            <!-- File Details -->
            <div v-if="selectionStore.uploadProgress.fileProgress.length > 0" class="space-y-2">
                <h4 class="text-xs font-medium text-neutral-700 dark:text-neutral-300">Détails des fichiers :
                </h4>
                <div class="grid gap-2 max-h-32 overflow-y-auto">
                    <div v-for="fileProgress in selectionStore.uploadProgress.fileProgress" :key="fileProgress.filename"
                        class="flex items-center justify-between p-2 rounded bg-neutral-50 dark:bg-neutral-800">
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                            <UIcon :name="getFileStatusIcon(fileProgress.status)"
                                :class="getFileStatusClass(fileProgress.status)" class="w-4 h-4 shrink-0" />
                            <span class="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                                {{ fileProgress.filename }}
                            </span>
                        </div>
                        <span class="text-xs font-medium" :class="getFileStatusTextClass(fileProgress.status)">
                            {{ getFileStatusText(fileProgress.status) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Statistics -->
            <div class="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <div class="flex gap-4">
                    <span class="flex items-center gap-1">
                        <UIcon name="i-lucide-upload" class="w-3 h-3" />
                        Uploadés: {{ selectionStore.uploadProgress.uploadedFiles }}/{{
                            selectionStore.uploadProgress.totalFiles }}
                    </span>
                    <span class="flex items-center gap-1">
                        <UIcon name="i-lucide-refresh-cw" class="w-3 h-3" />
                        Convertis: {{ selectionStore.uploadProgress.convertedFiles }}/{{
                            selectionStore.uploadProgress.totalFiles }}
                    </span>
                    <span v-if="selectionStore.uploadProgress.failedFiles > 0"
                        class="text-red-600 flex items-center gap-1">
                        <UIcon name="i-lucide-alert-circle" class="w-3 h-3" />
                        Échecs: {{ selectionStore.uploadProgress.failedFiles }}
                    </span>
                </div>
                <span class="font-medium">{{ selectionStore.uploadProgressPercentage }}%</span>
            </div>
        </div>
    </UCard>
</template>

<script lang="ts" setup>
// Use store
const selectionStore = useSelectionStore()

// File status helpers
const getFileStatusIcon = (status: string) => {
    switch (status) {
        case 'pending': return 'i-lucide-clock';
        case 'uploading': return 'i-lucide-upload';
        case 'uploaded': return 'i-lucide-check';
        case 'converting': return 'i-lucide-loader-2';
        case 'converted': return 'i-lucide-check-circle';
        case 'failed': return 'i-lucide-alert-circle';
        default: return 'i-lucide-help-circle';
    }
};

const getFileStatusClass = (status: string) => {
    switch (status) {
        case 'pending': return 'text-neutral-400';
        case 'uploading': return 'text-blue-500 animate-pulse';
        case 'uploaded': return 'text-green-500';
        case 'converting': return 'text-orange-500 animate-spin';
        case 'converted': return 'text-green-600';
        case 'failed': return 'text-red-500';
        default: return 'text-neutral-400';
    }
};

const getFileStatusText = (status: string) => {
    switch (status) {
        case 'pending': return 'En attente';
        case 'uploading': return 'Upload...';
        case 'uploaded': return 'Uploadé';
        case 'converting': return 'Conversion...';
        case 'converted': return 'Terminé';
        case 'failed': return 'Échec';
        default: return 'Inconnu';
    }
};

const getFileStatusTextClass = (status: string) => {
    switch (status) {
        case 'pending': return 'text-neutral-500';
        case 'uploading': return 'text-blue-600';
        case 'uploaded': return 'text-green-600';
        case 'converting': return 'text-orange-600';
        case 'converted': return 'text-green-700';
        case 'failed': return 'text-red-600';
        default: return 'text-neutral-500';
    }
};
</script>