<template>
    <div class="space-y-8 p-6">
        <!-- Soft Variants -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Soft Variants (Notion-like)</h3>
            <div class="flex flex-wrap gap-3">
                <UButton variant="soft" color="neutral" size="md">
                    <UIcon name="i-lucide-plus" class="w-4 h-4" />
                    Add Item
                </UButton>
                <UButton variant="soft" color="primary" size="md">
                    <UIcon name="i-lucide-edit" class="w-4 h-4" />
                    Edit
                </UButton>
                <UButton variant="soft" color="neutral" size="md">
                    <UIcon name="i-lucide-settings" class="w-4 h-4" />
                    Settings
                </UButton>
                <UButton variant="soft" color="success" size="md">
                    <UIcon name="i-lucide-check" class="w-4 h-4" />
                    Save
                </UButton>
                <UButton variant="soft" color="error" size="md">
                    <UIcon name="i-lucide-trash" class="w-4 h-4" />
                    Delete
                </UButton>
            </div>
        </div>

        <!-- Outline Variants -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Outline Variants</h3>
            <div class="flex flex-wrap gap-3">
                <UButton variant="outline" color="neutral" size="md">
                    <UIcon name="i-lucide-download" class="w-4 h-4" />
                    Download
                </UButton>
                <UButton variant="outline" color="primary" size="md">
                    <UIcon name="i-lucide-upload" class="w-4 h-4" />
                    Upload
                </UButton>
                <UButton variant="outline" color="neutral" size="sm">
                    Small
                </UButton>
                <UButton variant="outline" color="neutral" size="lg">
                    Large
                </UButton>
            </div>
        </div>

        <!-- Ghost Variants -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Ghost Variants (Minimal)</h3>
            <div class="flex flex-wrap gap-3">
                <UButton variant="ghost" color="neutral" size="md">
                    <UIcon name="i-lucide-eye" class="w-4 h-4" />
                    View
                </UButton>
                <UButton variant="ghost" color="primary" size="md">
                    <UIcon name="i-lucide-heart" class="w-4 h-4" />
                    Like
                </UButton>
                <UButton variant="ghost" color="neutral" size="md">
                    <UIcon name="i-lucide-share" class="w-4 h-4" />
                    Share
                </UButton>
            </div>
        </div>

        <!-- Solid Variants -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Solid Variants (Primary Actions)
            </h3>
            <div class="flex flex-wrap gap-3">
                <UButton variant="solid" color="primary" size="md">
                    <UIcon name="i-lucide-rocket" class="w-4 h-4" />
                    Launch
                </UButton>
                <UButton variant="solid" color="neutral" size="md">
                    <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
                    Confirm
                </UButton>
            </div>
        </div>

        <!-- Size Variations -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Size Variations</h3>
            <div class="flex flex-wrap items-center gap-3">
                <UButton variant="soft" color="neutral" size="xs">XS</UButton>
                <UButton variant="soft" color="neutral" size="sm">Small</UButton>
                <UButton variant="soft" color="neutral" size="md">Medium</UButton>
                <UButton variant="soft" color="neutral" size="lg">Large</UButton>
                <UButton variant="soft" color="neutral" size="xl">XL</UButton>
            </div>
        </div>

        <!-- Icon Only Buttons -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Icon Only Buttons</h3>
            <div class="flex flex-wrap gap-3">
                <UButton variant="soft" color="neutral" size="md" class="w-9 h-9 p-0">
                    <UIcon name="i-lucide-plus" class="w-4 h-4" />
                </UButton>
                <UButton variant="soft" color="primary" size="md" class="w-9 h-9 p-0">
                    <UIcon name="i-lucide-edit" class="w-4 h-4" />
                </UButton>
                <UButton variant="ghost" color="neutral" size="md" class="w-9 h-9 p-0">
                    <UIcon name="i-lucide-more-horizontal" class="w-4 h-4" />
                </UButton>
                <UButton variant="outline" color="neutral" size="md" class="w-9 h-9 p-0">
                    <UIcon name="i-lucide-settings" class="w-4 h-4" />
                </UButton>
            </div>
        </div>

        <!-- Loading States -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Loading States</h3>
            <div class="flex flex-wrap gap-3">
                <UButton variant="soft" color="primary" size="md" loading>
                    Loading...
                </UButton>
                <UButton variant="solid" color="primary" size="md" loading>
                    Processing
                </UButton>
            </div>
        </div>

        <!-- Color Variations -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Color Variations</h3>
            <div class="flex flex-wrap gap-3">
                <UButton variant="soft" color="info" size="md">Info</UButton>
                <UButton variant="soft" color="success" size="md">Success</UButton>
                <UButton variant="soft" color="warning" size="md">Warning</UButton>
                <UButton variant="soft" color="error" size="md">Error</UButton>
                <UButton variant="soft" color="secondary" size="md">Secondary</UButton>
                <UButton variant="soft" color="neutral" size="md">Neutral</UButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// No additional logic needed for this demo component
</script>
