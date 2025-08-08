import { serverSupabaseServiceRole } from "#supabase/server";
import type { ClientPasswordVerification } from "~/types/gallery";

export default defineEventHandler(async (event) => {
  const galleryId = getRouterParam(event, "id");
  const body = await readBody<ClientPasswordVerification>(event);

  if (!galleryId) {
    throw createError({
      statusCode: 400,
      message: "ID de galerie requis",
    });
  }

  try {
    const supabase = await serverSupabaseServiceRole(event);

    // Get gallery with project info directly
    const { data: gallery, error } = await supabase
      .from("galleries")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          description,
          password_hash,
          status
        )
      `
      )
      .eq("id", galleryId)
      .single();

    if (error) {
      console.error("[DEBUG] Verify API - Gallery query error:", error);
      if (error.code === "PGRST116") {
        throw createError({
          statusCode: 404,
          message: "Galerie non trouvée",
        });
      }
      throw new Error(`Failed to fetch gallery: ${error.message}`);
    }

    // Check if gallery is accessible to clients
    if (
      gallery.status !== "awaiting_client" &&
      gallery.status !== "completed" &&
      gallery.status !== "revision_requested"
    ) {
      console.error(
        "[DEBUG] Verify API - Gallery not accessible, status:",
        gallery.status
      );
      throw createError({
        statusCode: 403,
        message: "Galerie non accessible",
      });
    }

    // Type assertion pour le projet
    const projectData = gallery.project as {
      id: string;
      title: string;
      description: string | null;
      password_hash: string;
      status: string;
    };

    // If no password hash exists, consider it valid (no password required)
    if (!projectData.password_hash) {
      return { valid: true };
    }

    // If password hash exists, password is required
    if (!body?.password) {
      throw createError({
        statusCode: 400,
        message: "Mot de passe requis",
      });
    }

    const valid = body.password === projectData.password_hash;

    return { valid };
  } catch (error) {
    // Re-throw known errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unknown errors
    throw createError({
      statusCode: 500,
      message: "Erreur de vérification",
    });
  }
});
