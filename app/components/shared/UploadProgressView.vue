<template>
    <!-- Upload Progress View - Elegant and reusable -->
    <div class="flex flex-col items-center justify-center min-h-[400px] py-12 space-y-10">
        <div class="flex flex-col items-center space-y-6">
            <UIcon name="i-lucide-upload" class="w-10 h-10" color="primary" />

            <div>
                <h3 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    {{ title }}
                </h3>
                <p class="text-center text-lg text-neutral-600 dark:text-neutral-400">
                    {{ progress.completedFiles }} sur {{ progress.totalFiles }}
                    {{ itemName }}
                </p>
            </div>
        </div>

        <!-- Progress Section -->
        <div class="w-full max-w-lg space-y-4">
            <UProgress :value="progress.overallProgress" color="primary" size="lg" />

            <!-- Progress Info -->
            <div class="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                <div class="flex items-center gap-2">
                    <span class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {{ progress.overallProgress }}%
                    </span>
                    <span class="text-sm">terminé</span>
                </div>
                <div v-if="progress.estimatedTimeRemaining" class="flex items-center gap-1 text-sm">
                    <UIcon name="i-lucide-clock" class="w-4 h-4" />
                    <span>{{ formatTimeRemaining(progress.estimatedTimeRemaining) }}</span>
                </div>
            </div>
        </div>

        <!-- Error Alert (elegant) -->
        <div v-if="progress.failedFiles > 0"
            class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
            <div class="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 flex-shrink-0" />
                <span class="text-sm font-medium">
                    {{ progress.failedFiles }} {{ itemName }}{{ progress.failedFiles > 1 ? 's' : '' }} en échec
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { UploadProgress } from "~/types/upload";

interface Props {
    progress: UploadProgress;
    title?: string;
    itemName?: string;
}

withDefaults(defineProps<Props>(), {
    title: "Upload en cours",
    itemName: "fichiers",
});

// Helper method for upload progress
const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
        return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
};
</script>
