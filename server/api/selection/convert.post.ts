import { serverSupabaseServiceRole } from "#supabase/server";

interface ConversionRequest {
  rawFileUrl: string;
  rawFilePath: string;
  selectionId: string;
}

interface ConversionResponse {
  success: boolean;
  rawUrl: string;
  jpegUrl: string;
  rawFilePath: string;
  jpegFilePath: string;
}

export default defineEventHandler(
  async (event): Promise<ConversionResponse> => {
    const body = await readBody<ConversionRequest>(event);

    if (!body.rawFileUrl || !body.rawFilePath || !body.selectionId) {
      throw createError({
        statusCode: 400,
        message:
          "URL du fichier RAW, chemin du fichier et ID de sélection requis",
      });
    }

    try {
      const supabase = await serverSupabaseServiceRole(event);

      // Vérifier que la sélection existe
      const { data: selection, error: selectionError } = await supabase
        .from("selections")
        .select("id, project_id")
        .eq("id", body.selectionId)
        .single();

      if (selectionError || !selection) {
        throw createError({
          statusCode: 404,
          message: "Sélection non trouvée",
        });
      }

      // Télécharger le fichier RAW depuis Supabase Storage
      const { data: rawFile, error: downloadError } = await supabase.storage
        .from("selection-images")
        .download(body.rawFilePath);

      if (downloadError || !rawFile) {
        throw createError({
          statusCode: 500,
          message: `Erreur lors du téléchargement du fichier RAW: ${downloadError?.message}`,
        });
      }

      // Préparer le fichier pour l'envoi au microservice
      const formData = new FormData();
      const blob = new Blob([rawFile], { type: rawFile.type });
      const filename = body.rawFilePath.split("/").pop() || "image.raw";
      formData.append("file", blob, filename);

      // Appeler le microservice Python pour la conversion
      const conversionServiceUrl =
        "https://raw2jpg-production.up.railway.app/convert";

      const conversionResponse = await $fetch(conversionServiceUrl, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "image/jpeg",
        },
      });

      if (!conversionResponse) {
        throw createError({
          statusCode: 500,
          message: "Erreur lors de la conversion par le microservice",
        });
      }

      // Convertir la réponse en Blob JPEG
      const jpegBlob = new Blob([conversionResponse as ArrayBuffer], {
        type: "image/jpeg",
      });

      // Générer le chemin pour le fichier JPEG
      const jpegFilePath = body.rawFilePath.replace(/\.[^/.]+$/, ".jpg");

      // Upload du fichier JPEG dans Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("selection-images")
        .upload(jpegFilePath, jpegBlob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw createError({
          statusCode: 500,
          message: `Erreur lors de l'upload du fichier JPEG: ${uploadError.message}`,
        });
      }

      // Générer les URLs signées
      const [rawUrlResponse, jpegUrlResponse] = await Promise.all([
        supabase.storage
          .from("selection-images")
          .createSignedUrl(body.rawFilePath, 3600),
        supabase.storage
          .from("selection-images")
          .createSignedUrl(jpegFilePath, 3600),
      ]);

      if (rawUrlResponse.error || jpegUrlResponse.error) {
        throw createError({
          statusCode: 500,
          message: "Erreur lors de la génération des URLs signées",
        });
      }

      return {
        success: true,
        rawUrl: rawUrlResponse.data.signedUrl,
        jpegUrl: jpegUrlResponse.data.signedUrl,
        rawFilePath: body.rawFilePath,
        jpegFilePath: jpegFilePath,
      };
    } catch (error) {
      console.error("Conversion error:", error);

      // Re-throw les erreurs connues
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }

      // Gérer les erreurs inconnues
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la conversion du fichier",
      });
    }
  }
);
