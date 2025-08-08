import { serverSupabaseServiceRole } from "#supabase/server";
import type { MoodboardImage } from "~/types/moodboard";

export default defineEventHandler(async (event) => {
  const moodboardId = getRouterParam(event, "id");

  if (!moodboardId) {
    throw createError({
      statusCode: 400,
      message: "ID de moodboard requis",
    });
  }

  try {
    const supabase = await serverSupabaseServiceRole(event);

    // Verify moodboard exists and is accessible
    const { data: moodboard, error: moodboardError } = await supabase
      .from("moodboards")
      .select(
        `
        *,
        project:projects(
          id,
          title,
          password_hash,
          status
        )
      `
      )
      .eq("id", moodboardId)
      .single();

    if (moodboardError) {
      if (moodboardError.code === "PGRST116") {
        throw createError({
          statusCode: 404,
          message: "Moodboard non trouvé",
        });
      }
      throw new Error(`Failed to fetch moodboard: ${moodboardError.message}`);
    }

    // Check if moodboard allows client interactions
    if (
      moodboard.status !== "awaiting_client" &&
      moodboard.status !== "revision_requested"
    ) {
      throw createError({
        statusCode: 403,
        message: "Ajout d'images non autorisé pour ce moodboard",
      });
    }

    // Parse uploaded files
    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Aucun fichier fourni",
      });
    }

    const uploadedImages: MoodboardImage[] = [];
    const errors: string[] = [];

    // Process each uploaded file
    for (const file of formData) {
      if (file.name !== "files" || !file.data || !file.filename) {
        continue;
      }

      try {
        // Validate file type
        const mimeType = file.type || "";
        if (!mimeType.startsWith("image/")) {
          errors.push(`${file.filename}: Type de fichier non supporté`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.data.length > 100 * 1024 * 1024) {
          errors.push(`${file.filename}: Fichier trop volumineux (max 10MB)`);
          continue;
        }

        // Generate unique filename
        const fileExt = file.filename.split(".").pop() || "jpg";
        const uniqueFileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `anonymous/moodboards/${moodboardId}/${uniqueFileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("moodboard-images")
          .upload(filePath, file.data, {
            contentType: mimeType,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          errors.push(`${file.filename}: ${uploadError.message}`);
          continue;
        }

        // Create database record
        const imageData = {
          moodboard_id: moodboardId,
          file_url: filePath,
        };

        const { data: image, error: dbError } = await supabase
          .from("moodboard_images")
          .insert(imageData)
          .select()
          .single();

        if (dbError) {
          // Clean up uploaded file if database insert fails
          await supabase.storage.from("moodboard-images").remove([filePath]);

          errors.push(`${file.filename}: Erreur de base de données`);
          continue;
        }

        uploadedImages.push(image);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        errors.push(`${file.filename}: ${errorMessage}`);
      }
    }

    // Check results
    if (errors.length > 0 && uploadedImages.length === 0) {
      throw createError({
        statusCode: 400,
        message: `Échec de l'upload: ${errors.join(", ")}`,
      });
    }

    // Return results
    const result = {
      images: uploadedImages,
      uploadedCount: uploadedImages.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    return result;
  } catch (error) {
    // Re-throw known errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unknown errors
    throw createError({
      statusCode: 500,
      message: "Erreur serveur lors de l'upload",
    });
  }
});
