<template>
    <div class="space-y-4">
        <div class="flex items-center gap-3 mb-6">
            <div
                class="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-white" />
            </div>
            <div>
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Documents</h2>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">Contrat et devis à joindre</p>
            </div>
        </div>

        <!-- Contract Upload -->
        <UFormField label="Contrat" name="contract_url">
            <div class="space-y-4">
                <!-- Existing Contract File -->
                <div v-if="props.existingContractUrl"
                    class="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <UIcon name="i-lucide-file-text" class="w-5 h-5 text-orange-500" />
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {{ extractFilenameFromUrl(props.existingContractUrl) }}
                        </p>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">
                            Fichier existant
                        </p>
                    </div>
                    <UButton icon="i-lucide-external-link" size="xs" variant="ghost" color="neutral"
                        @click="openDocument(props.existingContractUrl)" />
                    <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error"
                        @click="removeExistingContract" />
                </div>

                <!-- New Contract Upload -->
                <UFileUpload v-model="contractFiles" multiple accept=".pdf,.doc,.docx" :max="1"
                    :max-size="50 * 1024 * 1024" label="Glissez-déposez votre contrat ici"
                    description="Formats supportés: PDF, DOC, DOCX • Max 50 MB" icon="i-lucide-upload" color="primary"
                    variant="area" size="lg" class="w-full min-h-32" layout="list" @error="handleUploadError" />
            </div>
        </UFormField>

        <!-- Quote Upload -->
        <UFormField label="Devis" name="quote_url">
            <div class="space-y-4">
                <!-- Existing Quote File -->
                <div v-if="props.existingQuoteUrl"
                    class="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <UIcon name="i-lucide-file-text" class="w-5 h-5 text-green-500" />
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {{ extractFilenameFromUrl(props.existingQuoteUrl) }}
                        </p>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">
                            Fichier existant
                        </p>
                    </div>
                    <UButton icon="i-lucide-external-link" size="xs" variant="ghost" color="neutral"
                        @click="openDocument(props.existingQuoteUrl)" />
                    <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error"
                        @click="removeExistingQuote" />
                </div>

                <!-- New Quote Upload -->
                <UFileUpload v-model="quoteFiles" multiple accept=".pdf,.doc,.docx" :max="1"
                    :max-size="50 * 1024 * 1024" label="Glissez-déposez votre devis ici"
                    description="Formats supportés: PDF, DOC, DOCX • Max 50 MB" icon="i-lucide-upload" color="primary"
                    variant="area" size="lg" class="w-full min-h-32" layout="list" @error="handleUploadError" />
            </div>
        </UFormField>

        <!-- Error Messages -->
        <div v-if="errors.length > 0" class="space-y-2">
            <UAlert v-for="(error, index) in errors" :key="index" color="error" variant="soft" :title="error"
                class="text-sm" />
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    contractFile: File | null;
    quoteFile: File | null;
    existingContractUrl?: string | null;
    existingQuoteUrl?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
    existingContractUrl: null,
    existingQuoteUrl: null
});

const emit = defineEmits<{
    'update:contractFile': [value: File | null];
    'update:quoteFile': [value: File | null];
}>();

// Local state for file uploads
const contractFiles = ref<File[]>([]);
const quoteFiles = ref<File[]>([]);
const errors = ref<string[]>([]);

// Utility function to extract filename from URL
const extractFilenameFromUrl = (url: string): string => {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];

    if (!filename) return "unknown_file";

    // Remove timestamp prefix if present
    const match = filename.match(/^(contract|quote)_\d+\.(.+)$/);
    if (match && match[1] && match[2]) {
        return `${match[1]}.${match[2]}`;
    }

    return filename;
};

// Watch for file changes and emit updates
watch(contractFiles, (files) => {
    if (files.length > 0) {
        emit('update:contractFile', files[0] as File);
    } else {
        emit('update:contractFile', null);
    }
});

watch(quoteFiles, (files) => {
    if (files.length > 0) {
        emit('update:quoteFile', files[0] as File);
    } else {
        emit('update:quoteFile', null);
    }
});

// Handle upload errors
const handleUploadError = (error: { message?: string }) => {
    if (error.message) {
        errors.value = [error.message];
        // Clear errors after a delay
        setTimeout(() => {
            errors.value = [];
        }, 3000);
    }
};

// Remove existing files
const removeExistingContract = () => {
    emit('update:contractFile', null);
};

const removeExistingQuote = () => {
    emit('update:quoteFile', null);
};

// Open document in new tab
const openDocument = async (url: string) => {
    try {
        if (url.startsWith('http')) {
            window.open(url, '_blank');
            return;
        }

        const { proposalService } = await import('~/services/proposalService');
        const signedUrl = await proposalService.getSignedUrl(url);
        window.open(signedUrl, '_blank');
    } catch (err) {
        console.error('Error opening document:', err);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: 'Impossible d\'ouvrir le document.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
};
</script>