import { galleryImageRepository } from "~/repositories/galleryImageRepository";
import { galleryRepository } from "~/repositories/galleryRepository";
import { projectService } from "~/services/projectService";
import { proposalService } from "~/services/proposalService";
import { MODULE_STATUS, StatusUtils } from "~/types/status";
import type {
  Gallery,
  GalleryImage,
  GalleryPricing,
  GalleryWithDetails,
  IGalleryFilters,
  IPagination,
} from "~/types/gallery";

export const galleryService = {
  /**
   * Fetch galleries with pagination and filtering
   */
  async getGalleries(
    filters: IGalleryFilters = {},
    pagination: IPagination
  ): Promise<Gallery[]> {
    const galleries = await galleryRepository.findMany(filters, pagination);

    // Business logic: sort by status priority
    return galleries.sort((a, b) => {
      const statusOrder = {
        [MODULE_STATUS.DRAFT]: 0,
        [MODULE_STATUS.AWAITING_CLIENT]: 1,
        [MODULE_STATUS.REVISION_REQUESTED]: 2,
        [MODULE_STATUS.PAYMENT_PENDING]: 3,
        [MODULE_STATUS.COMPLETED]: 4,
      };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  },

  /**
   * Get gallery by ID with validation
   */
  async getGalleryById(id: string): Promise<Gallery> {
    if (!id?.trim()) {
      throw new Error("Gallery ID is required");
    }

    const gallery = await galleryRepository.findById(id);

    if (!gallery) {
      throw new Error("Gallery not found");
    }

    return gallery;
  },

  /**
   * Get gallery by project ID with images
   */
  async getGalleryByProjectId(
    projectId: string
  ): Promise<GalleryWithDetails | null> {
    if (!projectId?.trim()) {
      throw new Error("Project ID is required");
    }

    const gallery = await galleryRepository.findByProjectId(projectId);

    if (!gallery) {
      return null;
    }

    // Get images count
    const images = await galleryImageRepository.findByGalleryId(gallery.id);

    return {
      ...gallery,
      images,
      imageCount: images.length,
    };
  },

  /**
   * Calculate gallery pricing based on proposal or project data
   */
  async calculateGalleryPricing(projectId: string): Promise<GalleryPricing> {
    const proposal = await proposalService.getProposalByProjectId(projectId);

    if (proposal) {
      // Use proposal data if available
      const basePrice = proposal.price;
      const depositPaid =
        proposal.deposit_required && proposal.deposit_amount
          ? proposal.deposit_amount
          : 0;
      const remainingAmount = basePrice - depositPaid;

      return {
        basePrice,
        depositPaid,
        remainingAmount,
        paymentRequired: remainingAmount > 0,
      };
    } else {
      // Use project data when no proposal exists
      const project = await projectService.getProjectById(projectId);

      if (!project) {
        return {
          basePrice: 0,
          depositPaid: 0,
          remainingAmount: 0,
          paymentRequired: false,
        };
      }

      const basePrice = project.initial_price || 0;
      const remainingAmount = project.remaining_amount || 0;
      const depositPaid =
        basePrice - remainingAmount < 0 ? 0 : basePrice - remainingAmount;

      return {
        basePrice,
        depositPaid,
        remainingAmount,
        paymentRequired: remainingAmount > 0,
      };
    }
  },

  /**
   * Create new gallery with validation and business rules
   */
  async createGallery(
    galleryData: Omit<Gallery, "id" | "created_at" | "updated_at">,
    shouldValidate: boolean = false
  ): Promise<{ gallery: Gallery; projectUpdated: boolean }> {
    if (!galleryData.project_id?.trim()) {
      throw new Error("Project ID is required");
    }

    // Check if gallery already exists for this project
    const existingGallery = await this.getGalleryByProjectId(
      galleryData.project_id
    );
    if (existingGallery) {
      throw new Error("Une galerie existe déjà pour ce projet");
    }

    // Calculate pricing if payment is required
    const pricing = await this.calculateGalleryPricing(galleryData.project_id);

    // Set payment_required based on pricing calculation if not explicitly set
    const finalGalleryData = {
      ...galleryData,
      payment_required: galleryData.payment_required ?? pricing.paymentRequired,
      status: shouldValidate
        ? MODULE_STATUS.AWAITING_CLIENT
        : MODULE_STATUS.DRAFT,
    };

    // Create gallery
    const gallery = await galleryRepository.create(finalGalleryData);

    // For now, we don't update project status automatically
    // This could be added later if needed
    const projectUpdated = false;

    return { gallery, projectUpdated };
  },

  /**
   * Update gallery with business rules
   */
  async updateGallery(
    id: string,
    updates: Partial<Gallery>,
    shouldValidate?: boolean
  ): Promise<{ gallery: Gallery; projectUpdated: boolean }> {
    const _existingGallery = await this.getGalleryById(id);

    // Handle validation status change
    const finalUpdates = { ...updates };
    if (shouldValidate !== undefined) {
      finalUpdates.status = shouldValidate ? MODULE_STATUS.AWAITING_CLIENT : MODULE_STATUS.DRAFT;
    }

    // Update gallery
    const gallery = await galleryRepository.update(id, finalUpdates);

    // For now, we don't update project status automatically
    const projectUpdated = false;

    return { gallery, projectUpdated };
  },

  /**
   * Confirm payment and validate gallery (photographe action)
   */
  async confirmPayment(galleryId: string): Promise<Gallery> {
    const gallery = await this.getGalleryById(galleryId);

    // Verify gallery is in payment_pending status
    if (gallery.status !== MODULE_STATUS.PAYMENT_PENDING) {
      throw new Error(
        "Cette galerie n'est pas en attente de confirmation de paiement"
      );
    }

    // Update gallery to completed status
    const updatedGallery = await galleryRepository.update(galleryId, {
      status: MODULE_STATUS.COMPLETED,
    });

    return updatedGallery;
  },

  /**
   * Delete gallery with dependency checks
   */
  async deleteGallery(id: string): Promise<void> {
    const gallery = await this.getGalleryById(id);

    // Business rule: can't delete galleries that are awaiting client or completed
    if (
      gallery.status === MODULE_STATUS.AWAITING_CLIENT ||
      gallery.status === MODULE_STATUS.COMPLETED ||
      gallery.status === MODULE_STATUS.PAYMENT_PENDING
    ) {
      throw new Error(
        "Cannot delete galleries that are awaiting client response, payment pending, or completed"
      );
    }

    // Delete all images first
    await galleryImageRepository.deleteMany(id);

    // Delete gallery
    await galleryRepository.delete(id);
  },

  /**
   * Upload multiple images to gallery
   */
  async uploadImages(
    galleryId: string,
    files: File[]
  ): Promise<GalleryImage[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour uploader des images");
    }

    if (!files.length) {
      throw new Error("Aucun fichier sélectionné");
    }

    // Verify gallery exists and belongs to user
    const _gallery = await this.getGalleryById(galleryId);

    const uploadedImages: GalleryImage[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          errors.push(`${file.name}: Type de fichier non supporté`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 100 * 1024 * 1024) {
          errors.push(`${file.name}: Fichier trop volumineux (max 10MB)`);
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `${user.value.id}/galleries/${galleryId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("gallery-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          errors.push(`${file.name}: ${uploadError.message}`);
          continue;
        }

        // Create database record
        const imageData = {
          gallery_id: galleryId,
          file_url: filePath,
        };

        const image = await galleryImageRepository.create(imageData);
        uploadedImages.push(image);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        errors.push(`${file.name}: ${errorMessage}`);
      }
    }

    if (errors.length > 0 && uploadedImages.length === 0) {
      throw new Error(`Échec de l'upload: ${errors.join(", ")}`);
    }

    if (errors.length > 0) {
      console.warn("Some uploads failed:", errors);
    }

    return uploadedImages;
  },

  /**
   * Get signed URL for gallery image
   */
  async getImageSignedUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder à l'image");
    }

    const { data, error } = await supabase.storage
      .from("gallery-images")
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  },

  /**
   * Delete image from gallery
   */
  async deleteImage(imageId: string): Promise<void> {
    await galleryImageRepository.delete(imageId);
  },

  /**
   * Get gallery status options for UI
   */
  getStatusOptions() {
    return StatusUtils.getModuleStatusOptions();
  },
};
