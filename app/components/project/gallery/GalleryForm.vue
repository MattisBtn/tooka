<template>
    <UForm id="gallery-form" :schema="schema" :state="state" class="space-y-6" @submit="handleSubmit">
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
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Paramètres de livraison et de paiement</p>
                </div>
            </div>

            <!-- Payment Configuration -->
            <div class="space-y-4">
                <UFormField v-if="!isFree" label="Paiement requis pour téléchargement" name="payment_required">
                    <USwitch v-model="state.payment_required" color="primary" size="md" :disabled="isFree" />
                </UFormField>

                <!-- Payment Information Section -->
                <div v-if="isPaymentInfoRequired"
                    class="space-y-4 pl-4 border-l-2 border-primary-200 dark:border-primary-800">
                    <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-lucide-credit-card" class="w-4 h-4 text-primary-600" />
                        <span class="text-sm font-medium text-primary-900 dark:text-primary-100">
                            Informations de paiement requises
                        </span>
                    </div>

                    <!-- Payment Method -->
                    <UFormField label="Méthode de paiement" name="payment_method" required>
                        <USelectMenu v-model="paymentMethod" value-key="value" :items="paymentMethodOptions"
                            placeholder="Choisir la méthode de paiement" icon="i-lucide-credit-card" />
                    </UFormField>

                    <!-- Bank Transfer Details -->
                    <div v-if="projectState.payment_method === 'bank_transfer'"
                        class="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                        <div class="flex items-center gap-2 mb-3">
                            <UIcon name="i-lucide-building-2" class="w-4 h-4 text-blue-600" />
                            <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Coordonnées bancaires pour le virement
                            </span>
                        </div>

                        <UFormField label="IBAN" name="bank_iban" required>
                            <UInput v-model="projectState.bank_iban" placeholder="FR76 1234 5678 9012 3456 7890 123"
                                icon="i-lucide-credit-card" />
                        </UFormField>

                        <UFormField label="BIC/SWIFT" name="bank_bic" required>
                            <UInput v-model="projectState.bank_bic" placeholder="EXAMPLEFR1" icon="i-lucide-building" />
                        </UFormField>

                        <UFormField label="Bénéficiaire" name="bank_beneficiary" required>
                            <UInput v-model="projectState.bank_beneficiary" placeholder="Votre Entreprise SARL"
                                icon="i-lucide-user" />
                        </UFormField>

                        <UAlert color="info" variant="soft" icon="i-lucide-info">
                            <template #description>
                                Ces coordonnées seront transmises au client pour effectuer le paiement.
                            </template>
                        </UAlert>
                    </div>

                    <!-- Payment Info Missing Alert -->
                    <UAlert v-if="isPaymentInfoMissing" color="warning" variant="soft" icon="i-lucide-alert-triangle">
                        <template #description>
                            Les informations de paiement sont requises pour que le client puisse effectuer le paiement.
                        </template>
                    </UAlert>
                </div>

                <!-- Pricing Information Display -->
                <div v-if="pricing"
                    class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-lucide-info" class="w-4 h-4 text-orange-500" />
                        <span class="text-sm font-medium text-orange-900 dark:text-orange-100">Informations de
                            tarification</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span class="text-orange-700 dark:text-orange-300">Prix total :</span>
                            <p class="font-semibold text-orange-900 dark:text-orange-100">{{ formattedBasePrice }}</p>
                        </div>
                        <div>
                            <span class="text-orange-700 dark:text-orange-300">Acompte payé :</span>
                            <p class="font-semibold text-orange-900 dark:text-orange-100">{{ formattedDepositPaid }}</p>
                        </div>
                        <div>
                            <span class="text-orange-700 dark:text-orange-300">Reste à payer :</span>
                            <p class="font-semibold text-orange-900 dark:text-orange-100">{{ formattedRemainingAmount }}
                            </p>
                        </div>
                    </div>

                    <!-- Payment method info if set -->
                    <div v-if="paymentMethodInfo" class="mt-3 pt-3 border-t border-orange-300 dark:border-orange-700">
                        <div class="flex items-center gap-2 mb-2">
                            <UIcon name="i-lucide-credit-card" class="w-4 h-4 text-orange-600" />
                            <span class="text-sm font-medium text-orange-900 dark:text-orange-100">
                                Méthode de paiement (définie lors de la proposition)
                            </span>
                        </div>
                        <div class="text-sm">
                            <span class="text-orange-700 dark:text-orange-300">Méthode :</span>
                            <span class="font-semibold text-orange-900 dark:text-orange-100 ml-1">
                                {{ paymentMethodInfo.label }}
                            </span>
                        </div>
                        <p class="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            La méthode de paiement a été définie lors de la proposition et ne peut pas être modifiée.
                        </p>
                    </div>

                    <div class="mt-3 text-xs text-orange-600 dark:text-orange-400">
                        {{ state.payment_required && pricing && pricing.remainingAmount > 0
                            ? `Le client devra payer ${formattedRemainingAmount} pour télécharger les images.`
                            : 'Le téléchargement sera gratuit pour le client.' }}
                    </div>
                </div>

                <UAlert v-if="state.payment_required && pricing && pricing.remainingAmount === 0" color="success"
                    variant="soft" icon="i-lucide-check-circle" title="Paiement déjà effectué">
                    <template #description>
                        L'acompte couvre le prix total. Le client pourra télécharger les images gratuitement.
                    </template>
                </UAlert>
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
                <ProjectGalleryImageUploadField v-model="selectedFiles" :max-files="200" />
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
            <UButton label="Annuler" color="neutral" variant="ghost" @click="emit('cancel')" />

            <UButton type="submit" label="Sauvegarder comme brouillon" color="neutral" variant="outline"
                :loading="isSubmitting && submitAsDraft" @click="submitAsDraft = true" />

            <UButton type="submit" label="Envoyer au client" color="primary" :loading="isSubmitting && !submitAsDraft"
                @click="submitAsDraft = false" />
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
        projectUpdated: boolean;
        selectedFiles?: File[]
    }): void;
    (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Use stores
const projectSetupStore = useProjectSetupStore()

// Check if project is free
const isFree = computed(() => projectSetupStore.isFree)

// Form state
const state = reactive<GalleryFormData>({
    payment_required: props.gallery?.payment_required ?? true,
    selection_id: props.gallery?.selection_id || null,
    status: props.gallery?.status || "draft",
});

// Watch isFree to update payment_required when project changes
watch(isFree, (free) => {
    if (free) {
        state.payment_required = false;
    }
}, { immediate: true });

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
const submitAsDraft = ref(false);

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
const formattedBasePrice = computed(() => {
    if (!pricing.value?.basePrice) return "Non défini";
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
    }).format(pricing.value.basePrice);
});

const formattedDepositPaid = computed(() => {
    if (!pricing.value?.depositPaid) return "Aucun acompte";
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
    }).format(pricing.value.depositPaid);
});

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
    return state.payment_required && (pricing.value?.remainingAmount ?? 0) > 0;
});
const isPaymentInfoMissing = computed(() => {
    if (!isPaymentInfoRequired.value) return false;
    if (projectState.payment_method === 'bank_transfer') {
        return !projectState.bank_iban || !projectState.bank_bic || !projectState.bank_beneficiary;
    }
    return !projectState.payment_method;
});

const paymentMethodInfo = computed(() => {
    if (!props.proposalPaymentInfo?.payment_method) return null;
    return paymentMethodOptions.find(option => option.value === props.proposalPaymentInfo?.payment_method);
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
        // Determine the new status based on user action
        let newStatus: "draft" | "awaiting_client";

        if (submitAsDraft.value) {
            newStatus = "draft";
        } else {
            newStatus = "awaiting_client";
        }

        // Emit the gallery data to parent component for handling
        emit("gallery-saved", {
            gallery: {
                ...state,
                status: newStatus,
            },
            project: projectState,
            projectUpdated: newStatus === "awaiting_client",
            selectedFiles: hasSelectedFiles.value ? selectedFiles.value : undefined
        });
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped>
/* Add any custom styles here */
</style>