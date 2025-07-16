import { serverSupabaseClient } from "#supabase/server";
import type { ClientProposalAccess } from "~/types/proposal";

export default defineEventHandler(
  async (event): Promise<ClientProposalAccess> => {
    const proposalId = getRouterParam(event, "id");

    if (!proposalId) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID de proposition requis",
      });
    }

    try {
      const supabase = await serverSupabaseClient(event);

      // Get proposal with project info directly
      const { data: proposal, error } = await supabase
        .from("proposals")
        .select(
          `
        *,
        project:projects(
          id,
          title,
          password_hash
        )
      `
        )
        .eq("id", proposalId)
        .single();

      if (error) {
        console.error("[DEBUG] Proposal API - Proposal query error:", error);
        if (error.code === "PGRST116") {
          throw createError({
            statusCode: 404,
            statusMessage: "Proposition non trouvée",
          });
        }
        throw new Error(`Failed to fetch proposal: ${error.message}`);
      }

      // Check if proposal is accessible to clients
      if (proposal.status === "draft") {
        throw createError({
          statusCode: 403,
          statusMessage: "Cette proposition n'est pas encore accessible",
        });
      }

      // Type assertion pour le projet
      const projectData = proposal.project as {
        id: string;
        title: string;
        password_hash: string;
      };

      return {
        project: {
          id: projectData.id,
          title: projectData.title,
          hasPassword: !!projectData.password_hash,
        },
        proposal,
      };
    } catch (error: unknown) {
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }

      console.error("Error fetching client proposal:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur lors de la récupération de la proposition",
      });
    }
  }
);
