interface ConversionResult {
  imageId: string;
  status: "success" | "error";
  result?: {
    originalUrl: string;
    convertedUrl: string;
    format: string;
  };
  error?: string;
}

interface ConversionResponse {
  message: string;
  results: ConversionResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

interface ConversionStatusResponse {
  imageId: string;
  status: string;
  sourceUrl: string;
  convertedUrl: string;
}

export const conversionService = {
  /**
   * Base URL for the conversion service
   */
  getBaseUrl(): string {
    const runtimeConfig = useRuntimeConfig();
    return (
      (runtimeConfig.public?.conversionServiceUrl as string) ||
      "https://tooka-converter-service-production.up.railway.app"
    );
  },

  /**
   * Convert multiple images using the Railway conversion service
   */
  async convertImages(imageIds: string[]): Promise<ConversionResponse> {
    if (!imageIds.length) {
      throw new Error("Au moins un ID d'image est requis");
    }

    try {
      const response = await $fetch<ConversionResponse>(
        `${this.getBaseUrl()}/convert`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            imageIds,
          },
        }
      );

      return response;
    } catch (error) {
      console.error("Conversion API error:", error);
      throw new Error(
        error instanceof Error
          ? `Erreur de conversion: ${error.message}`
          : "Erreur lors de la conversion des images"
      );
    }
  },

  /**
   * Convert a single image
   */
  async convertImage(imageId: string): Promise<ConversionResult> {
    const response = await this.convertImages([imageId]);
    const result = response.results.find((r) => r.imageId === imageId);

    if (!result) {
      throw new Error("Aucun résultat de conversion trouvé");
    }

    return result;
  },

  /**
   * Check conversion status for a specific image
   */
  async getConversionStatus(
    imageId: string
  ): Promise<ConversionStatusResponse> {
    try {
      const response = await $fetch<ConversionStatusResponse>(
        `${this.getBaseUrl()}/status/${imageId}`,
        {
          method: "GET",
        }
      );

      return response;
    } catch (error) {
      console.error("Status check error:", error);
      throw new Error(
        error instanceof Error
          ? `Erreur lors de la vérification du statut: ${error.message}`
          : "Erreur lors de la vérification du statut"
      );
    }
  },

  /**
   * Check if the conversion service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      await $fetch(`${this.getBaseUrl()}/health`);
      return true;
    } catch (error) {
      console.warn("Conversion service health check failed:", error);
      return false;
    }
  },
};
