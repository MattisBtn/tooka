<template>
    <!-- Upload Progress View - Elegant -->
    <SharedUploadProgressView v-if="isUploading" :progress="galleryStore.uploadProgress" title="Upload en cours"
        item-name="images" />

    <!-- Regular Form View -->
    <UForm v-else id="gallery-form" :schema="schema" :state="state" class="space-y-6" @submit="handleSubmit">
        <!-- Gallery Configuration -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-solar-gallery-bold" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Configuration de la galerie
                    </h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Paramètres de livraison et de validation
                    </p>
                </div>
            </div>

            <!-- Delivery Mode Configuration -->
            <div
                class="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-lucide-truck" class="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Mode de livraison
                    </span>
                </div>

                <UFormField name="requires_client_validation">
                    <div
                        class="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div class="flex items-center gap-3">
                            <UIcon :name="state.requires_client_validation ? 'i-lucide-user-check' : 'i-lucide-zap'"
                                class="w-4 h-4 text-neutral-500" />
                            <div>
                                <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    {{ state.requires_client_validation ? 'Validation requise' : 'Livraison directe' }}
                                </p>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                    {{ state.requires_client_validation
                                        ? 'Le client doit valider ou payer avant de télécharger'
                                        : 'Images disponibles immédiatement' }}
                                </p>
                            </div>
                        </div>
                        <USwitch v-model="state.requires_client_validation" color="primary" size="md" />
                    </div>
                </UFormField>

                <!-- Direct Delivery Info -->
                <div v-if="!state.requires_client_validation && (pricing?.remainingAmount ?? 0) > 0"
                    class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex items-center gap-2 mb-2">
                        <UIcon name="i-lucide-info" class="w-4 h-4 text-blue-600" />
                        <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Livraison directe activée
                        </span>
                    </div>
                    <p class="text-xs text-blue-700 dark:text-blue-300">
                        Le montant restant ({{ formattedRemainingAmount }}) sera automatiquement annulé et les images
                        seront disponibles immédiatement.
                    </p>
                </div>
            </div>

            <!-- Payment Configuration -->
            <div v-if="isPaymentInfoRequired" class="space-y-4">
                <!-- Payment Information Section -->
                <div
                    class="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-lucide-credit-card" class="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                        <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Configuration du paiement
                        </span>
                    </div>

                    <!-- Payment Method - Locked (when deposit already paid) -->
                    <div v-if="isPaymentMethodLocked" class="space-y-3">
                        <div
                            class="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <div class="flex items-center gap-3">
                                <UIcon name="i-lucide-credit-card" class="w-4 h-4 text-neutral-500" />
                                <div>
                                    <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                        {{ paymentMethodInfo?.label || 'Méthode non définie' }}
                                    </p>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        Définie lors du paiement de l'acompte
                                    </p>
                                </div>
                            </div>
                            <UIcon name="i-lucide-lock" class="w-4 h-4 text-neutral-400" />
                        </div>
                    </div>

                    <!-- Payment Method - Selectable (when no deposit paid yet) -->
                    <UFormField v-else-if="showPaymentMethodSelector" label="Méthode de paiement" name="payment_method"
                        required>
                        <USelectMenu v-model="paymentMethod" value-key="value" :items="paymentMethodOptions"
                            placeholder="Choisir la méthode de paiement" icon="i-lucide-credit-card" />
                    </UFormField>

                    <!-- Bank Transfer Details -->
                    <div v-if="(projectState.payment_method === 'bank_transfer') || (isPaymentMethodLocked && (props.project?.payment_method === 'bank_transfer' || props.proposalPaymentInfo?.payment_method === 'bank_transfer'))"
                        class="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <div class="flex items-center gap-2 mb-3">
                            <UIcon name="i-lucide-building-2" class="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                            <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Coordonnées bancaires
                            </span>
                        </div>

                        <div class="grid grid-cols-1 gap-4">
                            <UFormField label="IBAN" name="bank_iban" required>
                                <UInput v-model="projectState.bank_iban" placeholder="FR76 1234 5678 9012 3456 7890 123"
                                    icon="i-lucide-credit-card" />
                            </UFormField>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <UFormField label="BIC/SWIFT" name="bank_bic" required>
                                    <UInput v-model="projectState.bank_bic" placeholder="EXAMPLEFR1"
                                        icon="i-lucide-building" />
                                </UFormField>

                                <UFormField label="Bénéficiaire" name="bank_beneficiary" required>
                                    <UInput v-model="projectState.bank_beneficiary" placeholder="Votre Entreprise SARL"
                                        icon="i-lucide-user" />
                                </UFormField>
                            </div>
                        </div>
                    </div>

                    <!-- Remaining Amount Info -->
                    <div v-if="pricing && pricing.remainingAmount > 0"
                        class="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-neutral-600 dark:text-neutral-400">Montant à payer :</span>
                            <span class="font-semibold text-neutral-900 dark:text-neutral-100">{{
                                formattedRemainingAmount }}</span>
                        </div>
                    </div>

                    <!-- Payment Info Missing Alert -->
                    <UAlert v-if="isPaymentInfoMissing" color="warning" variant="soft" icon="i-lucide-alert-triangle">
                        <template #description>
                            Les informations de paiement sont requises pour que le client puisse effectuer le paiement.
                        </template>
                    </UAlert>
                </div>
            </div>
        </div>

        <USeparator />

        <!-- Images Section -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-upload" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Images de la galerie</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        <template v-if="hasExistingImages">
                            Gérez vos images existantes et ajoutez-en de nouvelles
                        </template>
                        <template v-else>
                            Uploadez vos images (jusqu'à 200+ images supportées)
                        </template>
                    </p>
                </div>
            </div>

            <!-- Existing Images -->
            <div v-if="hasExistingImages" class="space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Images existantes ({{ images.length }})
                    </h3>
                </div>

                <ProjectGalleryImageGrid :images="Array.from(images)" :can-delete="true" :is-editing="true"
                    @delete-image="handleDeleteExistingImage" />

                <USeparator />
            </div>

            <!-- New Images Upload -->
            <div class="space-y-3">
                <h3 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    <template v-if="hasExistingImages">Ajouter de nouvelles images</template>
                    <template v-else>Uploader des images</template>
                </h3>
                <ProjectGalleryImageUploadField v-model="selectedFiles" :max-files="200" :disabled="isFormDisabled" />
            </div>

            <!-- Summary -->
            <div v-if="totalImageCount > 0" class="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <UIcon name="i-lucide-images" class="w-4 h-4" />
                    <span>
                        Total : {{ totalImageCount }} image{{ totalImageCount > 1 ? 's' : '' }}
                        <span v-if="hasExistingImages && hasSelectedFiles">
                            ({{ images.length }} existante{{ images.length > 1 ? 's' : '' }} + {{ selectedFiles.length
                            }}
                            nouvelle{{ selectedFiles.length > 1 ? 's' : '' }})
                        </span>
                    </span>
                </div>
            </div>
        </div>

        <!-- Form Actions -->
        <div class="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <UButton label="Annuler" color="neutral" variant="ghost" :disabled="isFormDisabled"
                @click="emit('cancel')" />

            <UButton type="submit" :label="isUploading ? 'Upload en cours...' : 'Sauvegarder'" color="primary"
                :loading="isSubmitting" :disabled="isFormDisabled" />
        </div>
    </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { galleryFormSchema, type Gallery, type GalleryFormData, type GalleryImage, type GalleryPricing, type ProjectPaymentData } from "~/types/gallery";

interface ProposalPaymentInfo {
    payment_method: 'stripe' | 'bank_transfer' | null;
    deposit_required: boolean;
    deposit_amount: number | null;
}

interface Props {
    gallery?: Gallery;
    projectId: string;
    existingImages?: GalleryImage[];
    pricing?: GalleryPricing;
    proposalPaymentInfo?: ProposalPaymentInfo;
    project?: {
        id: string;
        payment_method: 'stripe' | 'bank_transfer' | null;
        bank_iban: string | null;
        bank_bic: string | null;
        bank_beneficiary: string | null;
    };
}

interface Emits {
    (e: "gallery-saved", data: {
        gallery: GalleryFormData;
        project: ProjectPaymentData;
        selectedFiles?: File[]
    }): void;
    (e: "cancel" | "upload-completed"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Use stores
const projectSetupStore = useProjectSetupStore()
const galleryStore = useGalleryStore()

// Check if project is free
const isFree = computed(() => projectSetupStore.isFree)

// Form state
const state = reactive<GalleryFormData>({
    selection_id: props.gallery?.selection_id || null,
    requires_client_validation: props.gallery?.requires_client_validation ?? true,
    status: props.gallery?.status || "draft",
});

// Project state for payment info
const projectState = reactive<ProjectPaymentData>({
    payment_method: props.project?.payment_method || null,
    bank_iban: props.project?.bank_iban || null,
    bank_bic: props.project?.bank_bic || null,
    bank_beneficiary: props.project?.bank_beneficiary || null,
});

// File upload states
const selectedFiles = ref<File[]>([]);

// Existing images management
const images = ref<GalleryImage[]>([...(props.existingImages || [])]);

// Validation schema
const schema = galleryFormSchema;

// Local loading state for form submission
const isSubmitting = ref(false);

// Upload state
const isUploading = computed(() => galleryStore.uploadProgress.isUploading);
const isFormDisabled = computed(() => isSubmitting.value || isUploading.value);



// Computed
const hasSelectedFiles = computed(() => selectedFiles.value.length > 0);
const hasExistingImages = computed(() => images.value.length > 0);
const totalImageCount = computed(() => images.value.length + selectedFiles.value.length);

// Payment method options for USelectMenu
const paymentMethodOptions = [
    { value: "stripe", label: "Stripe (Carte bancaire)", disabled: true },
    { value: "bank_transfer", label: "Virement bancaire" },
];

// Computed for payment method to handle null/undefined conversion for USelectMenu
const paymentMethod = computed({
    get: () => projectState.payment_method || undefined,
    set: (value: 'stripe' | 'bank_transfer' | undefined) => {
        projectState.payment_method = value || null;
    }
});

// Pricing computed
const pricing = computed(() => props.pricing);
const formattedRemainingAmount = computed(() => {
    if (!pricing.value?.remainingAmount) return "Gratuit";
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
    }).format(pricing.value.remainingAmount);
});

// Payment info computed
const isPaymentInfoRequired = computed(() => {
    // Si le projet est gratuit, le paiement n'est jamais requis
    if (isFree.value) return false;
    // Si la livraison directe est activée, le paiement n'est pas requis (sera annulé)
    if (!state.requires_client_validation) return false;
    return (pricing.value?.remainingAmount ?? 0) > 0;
});

const isPaymentMethodLocked = computed(() => {
    // La méthode de paiement est verrouillée si un acompte a déjà été payé
    return (pricing.value?.depositPaid ?? 0) > 0;
});

const showPaymentMethodSelector = computed(() => {
    // Afficher le sélecteur seulement si le paiement est requis mais la méthode n'est pas verrouillée
    return isPaymentInfoRequired.value && !isPaymentMethodLocked.value;
});

const isPaymentInfoMissing = computed(() => {
    if (!isPaymentInfoRequired.value) return false;

    // Si la méthode est verrouillée, on utilise la méthode existante du projet
    const methodToCheck = isPaymentMethodLocked.value
        ? (props.project?.payment_method || props.proposalPaymentInfo?.payment_method)
        : projectState.payment_method;

    if (methodToCheck === 'bank_transfer') {
        return !projectState.bank_iban || !projectState.bank_bic || !projectState.bank_beneficiary;
    }

    // Pour une méthode verrouillée, pas besoin de vérifier si elle est définie (elle l'est déjà)
    if (isPaymentMethodLocked.value) return false;

    return !projectState.payment_method;
});

const paymentMethodInfo = computed(() => {
    // Pour une méthode verrouillée, utiliser la méthode du projet ou de la proposition
    const lockedMethod = props.project?.payment_method || props.proposalPaymentInfo?.payment_method;
    if (isPaymentMethodLocked.value && lockedMethod) {
        return paymentMethodOptions.find(option => option.value === lockedMethod);
    }

    // Pour les méthodes non verrouillées, utiliser la méthode sélectionnée
    if (!isPaymentMethodLocked.value && projectState.payment_method) {
        return paymentMethodOptions.find(option => option.value === projectState.payment_method);
    }

    return null;
});

// Handle existing image deletion
const handleDeleteExistingImage = async (imageId: string) => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.');
    if (!confirmed) return;

    try {
        const { galleryService } = await import("~/services/galleryService");
        await galleryService.deleteImage(imageId);

        // Remove from local state
        images.value = images.value.filter((img) => img.id !== imageId);

        const toast = useToast();
        toast.add({
            title: "Image supprimée",
            description: "L'image a été supprimée avec succès.",
            icon: "i-lucide-check-circle",
            color: "success",
        });
    } catch (err) {
        console.error("Error deleting image:", err);
        const toast = useToast();
        toast.add({
            title: "Erreur",
            description: err instanceof Error ? err.message : "Une erreur est survenue lors de la suppression.",
            icon: "i-lucide-alert-circle",
            color: "error",
        });
    }
};

// Handle form submission
const handleSubmit = async (_event: FormSubmitEvent<GalleryFormData>) => {
    isSubmitting.value = true;
    try {
        // For creation, always save as draft
        // For update, keep current status
        const finalStatus = props.gallery ? props.gallery.status : "draft";

        // Emit the gallery data to parent component for handling
        emit("gallery-saved", {
            gallery: {
                ...state,
                status: finalStatus,
            },
            project: projectState,
            selectedFiles: hasSelectedFiles.value ? selectedFiles.value : undefined
        });
    } finally {
        isSubmitting.value = false;
    }
};




</script>