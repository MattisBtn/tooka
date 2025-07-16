import { proposalRepository } from "~/repositories/proposalRepository";
import { projectService } from "~/services/projectService";
import type { IPagination, IProposalFilters, Proposal } from "~/types/proposal";

export const proposalService = {
  /**
   * Fetch proposals with pagination and filtering
   */
  async getProposals(
    filters: IProposalFilters = {},
    pagination: IPagination
  ): Promise<Proposal[]> {
    const proposals = await proposalRepository.findMany(filters, pagination);

    // Business logic: sort by status priority
    return proposals.sort((a, b) => {
      const statusOrder = {
        draft: 0,
        awaiting_client: 1,
        revision_requested: 2,
        completed: 3,
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
    proposalData: Omit<Proposal, "id" | "created_at" | "updated_at">,
    shouldValidate: boolean = false
  ): Promise<{ proposal: Proposal; projectUpdated: boolean }> {
    if (!proposalData.project_id?.trim()) {
      throw new Error("Project ID is required");
    }

    // Verify project exists and belongs to user
    const project = await projectService.getProjectById(
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

    // Set status based on validation
    const finalProposalData = {
      ...proposalData,
      status: shouldValidate
        ? ("awaiting_client" as const)
        : ("draft" as const),
    };

    // Create proposal
    const proposal = await proposalRepository.create(finalProposalData);

    // Update project status if proposal is validated
    let projectUpdated = false;
    if (shouldValidate && project.status === "draft") {
      await projectService.updateProject(proposalData.project_id, {
        status: "in_progress",
      });
      projectUpdated = true;
    }

    return { proposal, projectUpdated };
  },

  /**
   * Update proposal with business rules
   */
  async updateProposal(
    id: string,
    updates: Partial<Proposal>,
    shouldValidate?: boolean
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

    // Handle validation status change
    const finalUpdates = { ...updates };
    if (shouldValidate !== undefined) {
      finalUpdates.status = shouldValidate ? "awaiting_client" : "draft";
    }

    // Update proposal
    const proposal = await proposalRepository.update(id, finalUpdates);

    // Update project status if proposal is being validated
    let projectUpdated = false;
    if (
      shouldValidate &&
      (existingProposal.status === "draft" ||
        existingProposal.status === "revision_requested")
    ) {
      const project = await projectService.getProjectById(
        existingProposal.project_id
      );
      if (project.status === "draft") {
        await projectService.updateProject(existingProposal.project_id, {
          status: "in_progress",
        });
        projectUpdated = true;
      }
    }

    return { proposal, projectUpdated };
  },

  /**
   * Delete proposal with dependency checks
   */
  async deleteProposal(id: string): Promise<void> {
    const proposal = await this.getProposalById(id);

    // Business rule: can't delete proposals that are awaiting client or completed
    if (
      proposal.status === "awaiting_client" ||
      proposal.status === "completed"
    ) {
      throw new Error(
        "Cannot delete proposals that are awaiting client response or completed"
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
   * Get proposal status options for UI
   */
  getStatusOptions() {
    return [
      {
        value: "draft" as const,
        label: "Brouillon",
        description: "Proposition en cours de préparation",
        icon: "i-lucide-file-text",
        color: "neutral",
      },
      {
        value: "awaiting_client" as const,
        label: "En attente client",
        description: "Proposition envoyée au client",
        icon: "i-lucide-clock",
        color: "warning",
      },
      {
        value: "revision_requested" as const,
        label: "Révision demandée",
        description: "Le client demande des modifications",
        icon: "i-lucide-edit",
        color: "info",
      },
      {
        value: "completed" as const,
        label: "Acceptée",
        description: "Proposition acceptée par le client",
        icon: "i-lucide-check-circle",
        color: "success",
      },
    ];
  },
};
