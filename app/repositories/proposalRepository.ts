import type { Proposal, ProposalWithProject } from "~/types/proposal";

export const proposalRepository = {
  async findById(id: string): Promise<ProposalWithProject | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("proposals")
      .select(
        `
        *,
        project:projects(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch proposal: ${error.message}`);
    }

    return data;
  },

  async findByProjectId(
    projectId: string
  ): Promise<ProposalWithProject | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("proposals")
      .select(
        `
        *,
        project:projects(*)
      `
      )
      .eq("project_id", projectId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch proposal: ${error.message}`);
    }

    return data;
  },

  async create(
    proposalData: Omit<Proposal, "id" | "created_at" | "updated_at">
  ): Promise<ProposalWithProject> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("proposals")
      .insert(proposalData)
      .select(
        `
        *,
        project:projects(*)
      `
      )
      .single();

    if (error) {
      // Handle specific constraint violations
      if (error.code === "23505") {
        // unique_violation
        throw new Error("Une proposition existe déjà pour ce projet");
      }
      if (error.code === "23503") {
        // foreign_key_violation
        throw new Error("Le projet spécifié n'existe pas");
      }
      if (error.code === "23514") {
        // check_violation - deposit validation
        if (error.message?.includes("deposit_amount")) {
          throw new Error(
            "Le montant de l'acompte ne peut pas dépasser le prix total"
          );
        }
        if (error.message?.includes("deposit_required")) {
          throw new Error(
            "Le montant de l'acompte est requis quand l'acompte est activé"
          );
        }
      }
      throw new Error(`Failed to create proposal: ${error.message}`);
    }

    return data;
  },

  async update(
    id: string,
    proposalData: Partial<Proposal>
  ): Promise<ProposalWithProject> {
    const supabase = useSupabaseClient();

    // Ensure updated_at is set
    const updateData = {
      ...proposalData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("proposals")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        project:projects(*)
      `
      )
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Proposition non trouvée");
      }
      if (error.code === "23514") {
        // check_violation - deposit validation
        if (error.message?.includes("deposit_amount")) {
          throw new Error(
            "Le montant de l'acompte ne peut pas dépasser le prix total"
          );
        }
        if (error.message?.includes("deposit_required")) {
          throw new Error(
            "Le montant de l'acompte est requis quand l'acompte est activé"
          );
        }
      }
      throw new Error(`Failed to update proposal: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = useSupabaseClient();

    const { error } = await supabase.from("proposals").delete().eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Proposition non trouvée");
      }
      throw new Error(`Failed to delete proposal: ${error.message}`);
    }
  },
};
