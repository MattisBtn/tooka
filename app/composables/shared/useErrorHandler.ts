/**
 * Composable pour gérer les erreurs HTTP de manière cohérente
 */
export const useErrorHandler = () => {
  /**
   * Détermine le message d'erreur approprié basé sur le code de statut HTTP
   */
  const getErrorMessage = (
    status: number,
    defaultMessage = "Erreur lors du chargement"
  ): string => {
    switch (status) {
      case 400:
        return "Requête invalide";
      case 401:
        return "Accès non autorisé";
      case 403:
        return "Accès interdit";
      case 404:
        return "Ressource non trouvée";
      case 408:
        return "Délai d'attente dépassé";
      case 429:
        return "Trop de requêtes";
      case 500:
        return "Erreur serveur";
      case 502:
        return "Erreur de passerelle";
      case 503:
        return "Service indisponible";
      case 504:
        return "Délai d'attente de la passerelle dépassé";
      default:
        return defaultMessage;
    }
  };

  /**
   * Détermine le code de statut HTTP basé sur le message d'erreur
   */
  const getStatusCodeFromMessage = (message: string): number => {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("non trouvée") ||
      lowerMessage.includes("not found")
    ) {
      return 404;
    }
    if (
      lowerMessage.includes("non accessible") ||
      lowerMessage.includes("forbidden")
    ) {
      return 403;
    }
    if (
      lowerMessage.includes("non autorisé") ||
      lowerMessage.includes("unauthorized")
    ) {
      return 401;
    }
    if (lowerMessage.includes("serveur") || lowerMessage.includes("server")) {
      return 500;
    }
    if (lowerMessage.includes("timeout") || lowerMessage.includes("délai")) {
      return 408;
    }

    return 500;
  };

  /**
   * Crée une erreur Nuxt avec le bon code de statut
   */
  const createNuxtError = (message: string, statusCode?: number) => {
    const code = statusCode || getStatusCodeFromMessage(message);
    return createError({
      statusCode: code,
      message,
    });
  };

  /**
   * Gère une erreur de fetch avec gestion automatique des codes de statut
   */
  const handleFetchError = (
    error: Error & { statusCode?: number },
    defaultMessage = "Erreur lors du chargement"
  ): Error => {
    let message = defaultMessage;
    let statusCode = 500;

    if (error?.statusCode) {
      statusCode = error.statusCode;
      message = getErrorMessage(statusCode, defaultMessage);
    } else if (error?.message) {
      message = error.message;
      statusCode = getStatusCodeFromMessage(message);
    }

    return new Error(message);
  };

  return {
    getErrorMessage,
    getStatusCodeFromMessage,
    createNuxtError,
    handleFetchError,
  };
};
