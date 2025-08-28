import { proposalRepository } from "~/repositories/proposalRepository";
import type { Proposal, ProposalWithProject } from "~/types/proposal";

export const proposalService = {
  /**
   * Get proposal by ID with validation
   */
  async getProposalById(id: string): Promise<ProposalWithProject> {
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
  async getProposalByProjectId(
    projectId: string
  ): Promise<ProposalWithProject | null> {
    if (!projectId?.trim()) {
      throw new Error("Project ID is required");
    }

    return await proposalRepository.findByProjectId(projectId);
  },

  /**
   * Create new proposal - simplified without pre-checks
   */
  async createProposal(
    proposalData: Omit<Proposal, "id" | "created_at" | "updated_at">
  ): Promise<ProposalWithProject> {
    if (!proposalData.project_id?.trim()) {
      throw new Error("Project ID is required");
    }

    // Create proposal (always draft) - let Supabase handle constraints
    const finalProposalData = {
      ...proposalData,
      status: "draft" as const,
    };

    return await proposalRepository.create(finalProposalData);
  },

  /**
   * Update proposal - simplified without pre-checks
   */
  async updateProposal(
    id: string,
    updates: Partial<Proposal>
  ): Promise<ProposalWithProject> {
    // Update proposal (keep current status)
    return await proposalRepository.update(id, updates);
  },

  /**
   * Confirm payment and validate proposal (photographe action)
   */
  async confirmPayment(proposalId: string): Promise<ProposalWithProject> {
    const proposal = await this.getProposalById(proposalId);

    // Verify proposal is in payment_pending status
    if (proposal.status !== "payment_pending") {
      throw new Error(
        "Cette proposition n'est pas en attente de confirmation de paiement"
      );
    }

    // Update proposal to completed status
    const updatedProposal = await proposalRepository.update(proposalId, {
      status: "completed",
    });

    return updatedProposal;
  },

  /**
   * Delete proposal with dependency checks
   */
  async deleteProposal(id: string): Promise<void> {
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
};
