import type { ProposalFormData, ProposalWithOptions } from "~/types/proposal";

export const proposalService = {
  /**
   * Get proposal by project ID with options
   */
  async getProposalByProjectId(
    projectId: string
  ): Promise<ProposalWithOptions | null> {
    const supabase = useSupabaseClient();

    const { data: proposal, error } = await supabase
      .from("proposals")
      .select(
        `
        *,
        options:proposal_options!proposal_id(*)
      `
      )
      .eq("project_id", projectId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No proposal found for this project
        return null;
      }
      throw new Error(`Failed to fetch proposal: ${error.message}`);
    }

    // Sort options by order_index
    const options = (proposal as any).options || [];
    const sortedOptions = options.sort(
      (a: any, b: any) => a.order_index - b.order_index
    );

    // Get selected option if any
    const selectedOption =
      sortedOptions.find((option: any) => option.is_selected) || null;

    return {
      ...proposal,
      options: sortedOptions,
      selected_option: selectedOption || undefined,
    };
  },

  /**
   * Create a new proposal with options
   */
  async createProposal(
    projectId: string,
    data: ProposalFormData
  ): Promise<ProposalWithOptions> {
    const supabase = useSupabaseClient();

    // Start a transaction
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .insert({
        project_id: projectId,
        status: "draft",
      })
      .select()
      .single();

    if (proposalError) {
      throw new Error(`Failed to create proposal: ${proposalError.message}`);
    }

    // Create proposal options
    if (data.options && data.options.length > 0) {
      const optionsToInsert = data.options.map((option, index) => ({
        proposal_id: proposal.id,
        title: option.title,
        content_html: option.content_html,
        content_json: option.content_json as any,
        price: option.price,
        deposit_required: option.deposit_required,
        deposit_amount: option.deposit_amount,
        order_index: index + 1,
      }));

      const { error: optionsError } = await supabase
        .from("proposal_options")
        .insert(optionsToInsert);

      if (optionsError) {
        throw new Error(
          `Failed to create proposal options: ${optionsError.message}`
        );
      }
    }

    // Return the created proposal with options
    return this.getProposalByProjectId(
      projectId
    ) as Promise<ProposalWithOptions>;
  },

  /**
   * Update an existing proposal
   */
  async updateProposal(
    proposalId: string,
    data: ProposalFormData
  ): Promise<ProposalWithOptions> {
    const supabase = useSupabaseClient();

    // Update proposal options
    if (data.options && data.options.length > 0) {
      // Delete existing options
      const { error: deleteError } = await supabase
        .from("proposal_options")
        .delete()
        .eq("proposal_id", proposalId);

      if (deleteError) {
        throw new Error(
          `Failed to delete existing options: ${deleteError.message}`
        );
      }

      // Insert new options
      const optionsToInsert = data.options.map((option, index) => ({
        proposal_id: proposalId,
        title: option.title,
        content_html: option.content_html,
        content_json: option.content_json as any,
        price: option.price,
        deposit_required: option.deposit_required,
        deposit_amount: option.deposit_amount,
        order_index: index + 1,
      }));

      const { error: insertError } = await supabase
        .from("proposal_options")
        .insert(optionsToInsert);

      if (insertError) {
        throw new Error(`Failed to insert new options: ${insertError.message}`);
      }
    }

    // Get the updated proposal with options
    const { data: proposal } = await supabase
      .from("proposals")
      .select("project_id")
      .eq("id", proposalId)
      .single();

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    return this.getProposalByProjectId(
      proposal.project_id
    ) as Promise<ProposalWithOptions>;
  },

  /**
   * Delete a proposal and its options
   */
  async deleteProposal(proposalId: string): Promise<void> {
    const supabase = useSupabaseClient();

    // Delete proposal options first (cascade should handle this, but being explicit)
    const { error: optionsError } = await supabase
      .from("proposal_options")
      .delete()
      .eq("proposal_id", proposalId);

    if (optionsError) {
      throw new Error(
        `Failed to delete proposal options: ${optionsError.message}`
      );
    }

    // Delete the proposal
    const { error: proposalError } = await supabase
      .from("proposals")
      .delete()
      .eq("id", proposalId);

    if (proposalError) {
      throw new Error(`Failed to delete proposal: ${proposalError.message}`);
    }
  },

  /**
   * Send proposal to client (change status to sent_to_client)
   */
  async sendToClient(proposalId: string): Promise<void> {
    const supabase = useSupabaseClient();

    const { error } = await supabase
      .from("proposals")
      .update({ status: "sent_to_client" as const })
      .eq("id", proposalId);

    if (error) {
      throw new Error(`Failed to send proposal to client: ${error.message}`);
    }
  },

  /**
   * Update proposal status
   */
  async updateStatus(proposalId: string, status: string): Promise<void> {
    const supabase = useSupabaseClient();

    const { error } = await supabase
      .from("proposals")
      .update({ status: status as any })
      .eq("id", proposalId);

    if (error) {
      throw new Error(`Failed to update proposal status: ${error.message}`);
    }
  },
};
