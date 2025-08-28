export const useScreenshotProtection = () => {
  const isProtected = ref(false);

  const enableProtection = () => {
    if (isProtected.value) return; // Éviter les doublons

    // Vérifier que nous sommes côté client
    if (import.meta.server || typeof document === "undefined") {
      return;
    }

    // Détecter les raccourcis clavier pour les captures d'écran
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrtScn, Ctrl+PrtScn, Alt+PrtScn, Shift+PrtScn
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.key === "p") ||
        (e.ctrlKey && e.key === "s") ||
        (e.ctrlKey && e.key === "u") ||
        e.key === "F12"
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Détecter les tentatives de copie
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Détecter les tentatives de capture d'écran via l'API
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // L'utilisateur a potentiellement changé d'onglet pour faire une capture
        document.body.style.display = "none";
        setTimeout(() => {
          document.body.style.display = "";
        }, 100);
      }
    };

    // Protection mobile - détecter les gestes de capture d'écran
    const handleTouchStart = (e: TouchEvent) => {
      // Bloquer les gestes multi-touches qui pourraient déclencher des captures
      if (e.touches.length > 2) {
        e.preventDefault();
        return false;
      }
    };

    // Protection mobile - détecter les changements d'orientation
    const handleOrientationChange = () => {
      // Masquer temporairement le contenu lors des changements d'orientation
      document.body.style.opacity = "0";
      setTimeout(() => {
        document.body.style.opacity = "1";
      }, 300);
    };

    // Protection mobile - détecter les tentatives de zoom
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        return false;
      }
    };

    // Protection mobile - détecter les tentatives de capture via l'API Screen Capture
    const handleScreenCaptureAttempt = async () => {
      try {
        // Tenter d'accéder à l'API Screen Capture pour la bloquer
        if ("getDisplayMedia" in navigator) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
          });
          // Si on arrive ici, c'est qu'une capture a été tentée
          stream.getTracks().forEach((track) => track.stop());
          // Masquer le contenu
          document.body.style.display = "none";
          setTimeout(() => {
            document.body.style.display = "";
          }, 1000);
        }
      } catch {
        // L'API est bloquée ou non supportée
      }
    };

    // Ajouter les event listeners
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("orientationchange", handleOrientationChange);
    document.addEventListener("wheel", handleWheel, { passive: false });

    // Surveiller les tentatives de capture d'écran
    const intervalId = setInterval(handleScreenCaptureAttempt, 2000);

    // Stocker les références pour le nettoyage
    const cleanup = () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener(
        "orientationchange",
        handleOrientationChange
      );
      document.removeEventListener("wheel", handleWheel);
      clearInterval(intervalId);
      isProtected.value = false;
    };

    // Nettoyer automatiquement quand le composant est détruit
    onUnmounted(cleanup);

    isProtected.value = true;

    return cleanup;
  };

  const disableProtection = () => {
    // La protection se désactive automatiquement via onUnmounted
    isProtected.value = false;
  };

  return {
    isProtected: readonly(isProtected),
    enableProtection,
    disableProtection,
  };
};
