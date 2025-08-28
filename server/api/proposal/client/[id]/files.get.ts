import { serverSupabaseServiceRole } from "#supabase/server";

/**
 * Get signed URLs for proposal files (contract and quote)
 * Accessible by clients for non-draft proposals
 */
export default defineEventHandler(async (event) => {
  const proposalId = getRouterParam(event, "id");

  if (!proposalId) {
    throw createError({
      statusCode: 400,
      message: "ID de proposition requis",
    });
  }

  try {
    const supabase = await serverSupabaseServiceRole(event);

    // Get proposal with file URLs
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("id, status, contract_url, quote_url")
      .eq("id", proposalId)
      .single();

    if (proposalError || !proposal) {
      throw createError({
        statusCode: 404,
        message: "Proposition non trouvée",
      });
    }

    // Check if proposal is accessible to clients
    if (proposal.status === "draft") {
      throw createError({
        statusCode: 403,
        message: "Cette proposition n'est pas encore accessible",
      });
    }

    // Generate signed URLs for existing files
    const filePromises = [];

    if (proposal.contract_url) {
      filePromises.push(
        supabase.storage
          .from("proposals")
          .createSignedUrl(proposal.contract_url, 3600)
          .then(({ data, error }) => {
            if (!error && data?.signedUrl) {
              return {
                type: "contract",
                url: data.signedUrl,
              };
            }
            return null;
          })
          .catch((error) => {
            console.error("Error generating contract signed URL:", error);
            return null;
          })
      );
    }

    if (proposal.quote_url) {
      filePromises.push(
        supabase.storage
          .from("proposals")
          .createSignedUrl(proposal.quote_url, 3600)
          .then(({ data, error }) => {
            if (!error && data?.signedUrl) {
              return {
                type: "quote",
                url: data.signedUrl,
              };
            }
            return null;
          })
          .catch((error) => {
            console.error("Error generating quote signed URL:", error);
            return null;
          })
      );
    }

    // Wait for all file URL generations to complete and filter out nulls
    const fileResults = await Promise.all(filePromises);
    const files = fileResults.filter(
      (file): file is { type: string; url: string } => file !== null
    );

    return {
      success: true,
      files,
    };
  } catch (error) {
    // Re-throw known errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error getting proposal files:", error);
    throw createError({
      statusCode: 500,
      message: "Erreur serveur",
    });
  }
});
