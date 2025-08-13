import type { ProposalComponent } from "~/composables/proposals/useProposalComponentTypes";
import { proposalRepository } from "~/repositories/proposalRepository";
import { projectService } from "~/services/projectService";
import { MODULE_STATUS, StatusUtils } from "~/types/status";
import type { Proposal, ProposalStatus } from "~/types/proposal";

export const proposalService = {
  /**
   * Fetch proposals with pagination and filtering
   */
  async getProposals(
    filters: {
      search?: string;
      status?: ProposalStatus | null;
      project_id?: string;
    } = {},
    pagination: { page: number; pageSize: number }
  ): Promise<Proposal[]> {
    const proposals = await proposalRepository.findMany(filters, pagination);

    // Business logic: sort by status priority
    return proposals.sort((a: Proposal, b: Proposal) => {
      const statusOrder: Record<ProposalStatus, number> = {
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
   * Get proposal by ID with validation
   */
  async getProposalById(id: string): Promise<Proposal> {
    if (!id?.trim()) {
      throw new Error("Proposal ID is required");
    }

    const proposal = await proposalRepository.findById(id);

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    return proposal;
  },

  /**
   * Get proposal by project ID
   */
  async getProposalByProjectId(projectId: string): Promise<Proposal | null> {
    if (!projectId?.trim()) {
      throw new Error("Project ID is required");
    }

    return await proposalRepository.findByProjectId(projectId);
  },

  /**
   * Create new proposal with validation and business rules
   */
  async createProposal(
    proposalData: Omit<Proposal, "id" | "created_at" | "updated_at">
  ): Promise<{ proposal: Proposal; projectUpdated: boolean }> {
    if (!proposalData.project_id?.trim()) {
      throw new Error("Project ID is required");
    }

    // Verify project exists and belongs to user
    const _project = await projectService.getProjectById(
      proposalData.project_id
    );

    // Check if proposal already exists for this project
    const existingProposal = await this.getProposalByProjectId(
      proposalData.project_id
    );
    if (existingProposal) {
      throw new Error("Une proposition existe déjà pour ce projet");
    }

    // Business rule: validate deposit logic
    if (
      proposalData.deposit_required &&
      (!proposalData.deposit_amount || proposalData.deposit_amount <= 0)
    ) {
      throw new Error(
        "Le montant de l'acompte est requis quand l'acompte est activé"
      );
    }

    if (
      proposalData.deposit_amount &&
      proposalData.deposit_amount > proposalData.price
    ) {
      throw new Error(
        "Le montant de l'acompte ne peut pas dépasser le prix total"
      );
    }

    // Create proposal (always draft)
    const finalProposalData = {
      ...proposalData,
      status: MODULE_STATUS.DRAFT,
    };

    const proposal = await proposalRepository.create(finalProposalData);

    // Update project status if needed (proposal is draft, so project stays draft)
    await projectService.updateProjectStatusIfNeeded(proposalData.project_id);

    return { proposal, projectUpdated: false };
  },

  /**
   * Update proposal with business rules
   */
  async updateProposal(
    id: string,
    updates: Partial<Proposal>
  ): Promise<{ proposal: Proposal; projectUpdated: boolean }> {
    const existingProposal = await this.getProposalById(id);

    // Business rule: validate deposit logic if being updated
    if (
      updates.deposit_required !== undefined ||
      updates.deposit_amount !== undefined ||
      updates.price !== undefined
    ) {
      const finalDepositRequired =
        updates.deposit_required ?? existingProposal.deposit_required;
      const finalDepositAmount =
        updates.deposit_amount ?? existingProposal.deposit_amount;
      const finalPrice = updates.price ?? existingProposal.price;

      if (
        finalDepositRequired &&
        (!finalDepositAmount || finalDepositAmount <= 0)
      ) {
        throw new Error(
          "Le montant de l'acompte est requis quand l'acompte est activé"
        );
      }

      if (finalDepositAmount && finalDepositAmount > finalPrice) {
        throw new Error(
          "Le montant de l'acompte ne peut pas dépasser le prix total"
        );
      }
    }

    // Update proposal (keep current status)
    const proposal = await proposalRepository.update(id, updates);

    // Update project status if needed (based on new proposal status)
    await projectService.updateProjectStatusIfNeeded(
      existingProposal.project_id
    );

    return { proposal, projectUpdated: false };
  },

  /**
   * Confirm payment and validate proposal (photographe action)
   */
  async confirmPayment(proposalId: string): Promise<Proposal> {
    const proposal = await this.getProposalById(proposalId);

    // Verify proposal is in payment_pending status
    if (proposal.status !== MODULE_STATUS.PAYMENT_PENDING) {
      throw new Error(
        "Cette proposition n'est pas en attente de confirmation de paiement"
      );
    }

    // Update proposal to completed status
    const updatedProposal = await proposalRepository.update(proposalId, {
      status: MODULE_STATUS.COMPLETED,
    });

    return updatedProposal;
  },

  /**
   * Delete proposal with dependency checks
   */
  async deleteProposal(id: string): Promise<void> {
    const proposal = await this.getProposalById(id);

    // Business rule: can't delete proposals that are not draft
    if (proposal.status !== MODULE_STATUS.DRAFT) {
      throw new Error(
        "Seules les propositions en brouillon peuvent être supprimées"
      );
    }

    await proposalRepository.delete(id);
  },

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    file: File,
    projectId: string,
    type: "contract" | "quote"
  ): Promise<string> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour uploader un fichier");
    }

    // Generate unique filename with user organization
    const fileExt = file.name.split(".").pop();
    const fileName = `${type}_${Date.now()}.${fileExt}`;
    const filePath = `${user.value.id}/proposals/${projectId}/${fileName}`;

    const { error } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Return the file path instead of public URL since bucket is private
    // We'll generate signed URLs when needed for access
    return filePath;
  },

  /**
   * Get signed URL for accessing a private file
   */
  async getSignedUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder au fichier");
    }

    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  },

  /**
   * Get public URL for accessing a file (if bucket is public)
   * Falls back to signed URL if bucket is private
   */
  async getPublicUrl(filePath: string): Promise<string> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder au fichier");
    }

    try {
      // Try to get public URL first
      const { data } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      if (data.publicUrl) {
        return data.publicUrl;
      }
    } catch {
      // If public URL fails, fall back to signed URL
    }

    // Fall back to signed URL for private buckets
    return await this.getSignedUrl(filePath);
  },

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer le fichier");
    }

    const { error } = await supabase.storage
      .from("documents")
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },

  /**
   * Delete multiple files from storage (helper)
   */
  async deleteFiles(filePaths: string[]): Promise<void> {
    if (!filePaths.length) return;
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();
    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer les fichiers");
    }
    const { error } = await supabase.storage
      .from("proposals")
      .remove(filePaths);
    if (error) {
      throw new Error(`Failed to delete files: ${error.message}`);
    }
  },

  /**
   * Upload portfolio images from previews to storage
   */
  async uploadPortfolioImages(
    components: ProposalComponent[],
    proposalId: string
  ): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();
    if (!user.value) {
      throw new Error("Vous devez être connecté pour uploader les images");
    }

    const basePath = `${user.value.id}/proposals/${proposalId}/portfolio`;

    for (const comp of components) {
      if (comp.type !== "portfolio") continue;

      const items = comp.items || [];
      const updated: typeof items = [];

      for (const it of items) {
        if (it.previewUrl && !it.url) {
          // Convert dataURL to Blob
          const blob = this.dataURLToBlob(it.previewUrl);
          const ext = "jpg";
          const name = `${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;
          const filePath = `${basePath}/${name}`;

          const { error } = await supabase.storage
            .from("proposals")
            .upload(filePath, blob, {
              cacheControl: "3600",
              upsert: false,
              contentType: blob.type || "image/jpeg",
            });

          if (error) {
            console.warn(`Failed to upload ${name}:`, error.message);
            updated.push(it);
            continue;
          }

          const { data } = supabase.storage
            .from("proposals")
            .getPublicUrl(filePath);
          updated.push({
            url: data.publicUrl,
            path: filePath,
            title: it.title,
            category: it.category,
          });
        } else {
          updated.push(it);
        }
      }

      comp.items = updated;
    }
  },

  /**
   * Convert dataURL to Blob
   */
  dataURLToBlob(dataURL: string): Blob {
    const parts = dataURL.split(",");
    const mimeMatch = parts[0]?.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(parts[1] || "");
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  },

  /**
   * Get proposal status options for UI
   */
  getStatusOptions() {
    return StatusUtils.getModuleStatusOptions();
  },
};
