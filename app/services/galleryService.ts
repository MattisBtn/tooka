import { galleryImageRepository } from "~/repositories/galleryImageRepository";
import { galleryRepository } from "~/repositories/galleryRepository";
import { projectService } from "~/services/projectService";
import { proposalService } from "~/services/proposalService";
import type {
  Gallery,
  GalleryImage,
  GalleryPricing,
  GalleryUploadResult,
  GalleryWithDetails,
} from "~/types/gallery";
import type { UploadOptions } from "~/types/upload";
import { GALLERY_UPLOAD_CONFIG } from "~/types/upload";
import { uploadImagesWithProgress } from "~/utils/uploadService";

export const galleryService = {
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

    return {
      ...gallery,
      images:
        (gallery as Gallery & { gallery_images?: GalleryImage[] })
          .gallery_images || [],
      imageCount: (
        (gallery as Gallery & { gallery_images?: GalleryImage[] })
          .gallery_images || []
      ).length,
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
      };
    } else {
      // Use project data when no proposal exists
      const project = await projectService.getProjectById(projectId);

      if (!project) {
        return {
          basePrice: 0,
          depositPaid: 0,
          remainingAmount: 0,
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
      };
    }
  },

  /**
   * Create new gallery with validation and business rules
   */
  async createGallery(
    galleryData: Omit<Gallery, "id" | "created_at" | "updated_at">,
    _shouldValidate: boolean = false
  ): Promise<{ gallery: Gallery; projectUpdated: boolean }> {
    if (!galleryData.project_id?.trim()) {
      throw new Error("Project ID is required");
    }

    // For creation, always start as draft
    // The sendToClient action will handle the final delivery logic
    const finalStatus: Gallery["status"] = "draft";
    const projectUpdated = false;

    const finalGalleryData = {
      ...galleryData,
      status: finalStatus,
    };

    // Create gallery
    const gallery = await galleryRepository.create(finalGalleryData);

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
    const existingGallery = await this.getGalleryById(id);
    let projectUpdated = false;

    // Handle validation status change
    const finalUpdates = { ...updates };

    // Only handle status changes when explicitly requested via shouldValidate
    if (shouldValidate !== undefined) {
      if (shouldValidate) {
        // Check if direct delivery mode is enabled
        if (
          existingGallery.requires_client_validation === false ||
          finalUpdates.requires_client_validation === false
        ) {
          // Direct delivery mode: set to completed immediately
          finalUpdates.status = "completed";

          // For direct delivery with remaining amount, set remaining_amount to 0
          const pricing = await this.calculateGalleryPricing(
            existingGallery.project_id
          );
          const { projectService } = await import("~/services/projectService");

          if (pricing.remainingAmount > 0) {
            await projectService.updateProject(existingGallery.project_id, {
              remaining_amount: 0,
            });
            projectUpdated = true;
          }
        } else {
          // Standard validation flow: send to client
          finalUpdates.status = "awaiting_client";
        }
      } else {
        // Save as draft
        finalUpdates.status = "draft";
      }
    }
    // If shouldValidate is not provided, keep current status (normal form save)

    // Update gallery
    const gallery = await galleryRepository.update(id, finalUpdates);

    // Check if project should be updated to completed status after gallery update
    if (gallery.status === "completed") {
      const { projectService } = await import("~/services/projectService");
      const project = await projectService.getProjectById(
        existingGallery.project_id
      );
      if (project && projectService.shouldUpdateProjectToCompleted(project)) {
        await projectService.updateProject(existingGallery.project_id, {
          status: "completed",
        });
        projectUpdated = true;
      }
    }

    return { gallery, projectUpdated };
  },

  /**
   * Confirm payment and validate gallery (photographe action)
   */
  async confirmPayment(galleryId: string): Promise<Gallery> {
    const gallery = await this.getGalleryById(galleryId);

    // Verify gallery is in payment_pending status
    if (gallery.status !== "payment_pending") {
      throw new Error(
        "Cette galerie n'est pas en attente de confirmation de paiement"
      );
    }

    // Update gallery to completed status
    const updatedGallery = await galleryRepository.update(galleryId, {
      status: "completed",
    });

    return updatedGallery;
  },

  /**
   * Delete gallery with dependency checks
   */
  async deleteGallery(id: string): Promise<void> {
    await galleryRepository.delete(id);
  },

  /**
   * Upload multiple images with detailed progress tracking and parallel processing
   */
  async uploadImagesWithProgress(
    galleryId: string,
    files: File[],
    options: UploadOptions = {}
  ): Promise<GalleryUploadResult> {
    // Verify gallery exists
    const _gallery = await this.getGalleryById(galleryId);

    return uploadImagesWithProgress<GalleryImage>(
      galleryId,
      files,
      GALLERY_UPLOAD_CONFIG,
      galleryImageRepository,
      (galleryId: string, filePath: string) => ({
        gallery_id: galleryId,
        file_url: filePath,
      }),
      options
    );
  },

  /**
   * Delete image from gallery
   */
  async deleteImage(imageId: string): Promise<void> {
    await galleryImageRepository.delete(imageId);
  },
};
