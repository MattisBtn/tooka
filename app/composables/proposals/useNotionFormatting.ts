export interface FormattingMenuState {
  isVisible: boolean;
  position: { x: number; y: number };
  blockId: string | null;
  selection: { start: number; end: number } | null;
  activeFormats: Set<string>; // Formats actifs dans la sélection
}

export const useNotionFormatting = () => {
  const formattingMenu = ref<FormattingMenuState>({
    isVisible: false,
    position: { x: 0, y: 0 },
    blockId: null,
    selection: null,
    activeFormats: new Set(),
  });

  // Analyser les formats actifs dans la sélection
  const analyzeActiveFormats = (element: HTMLElement): Set<string> => {
    const activeFormats = new Set<string>();
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return activeFormats;
    }

    const range = selection.getRangeAt(0);

    // Vérifier si la sélection est dans l'élément
    if (!element.contains(range.commonAncestorContainer)) {
      return activeFormats;
    }

    // Méthode 1: Utiliser queryCommandState (plus fiable)
    try {
      if (document.queryCommandState("bold")) {
        activeFormats.add("bold");
      }
      if (document.queryCommandState("italic")) {
        activeFormats.add("italic");
      }
      if (document.queryCommandState("underline")) {
        activeFormats.add("underline");
      }
      if (document.queryCommandState("strikeThrough")) {
        activeFormats.add("strikethrough");
      }
    } catch {
      // Fallback si queryCommandState échoue
    }

    // Méthode 2: Analyser les nœuds parents de la sélection
    let node: Node | null = range.startContainer;

    // Parcourir les parents jusqu'à l'élément contenteditable
    while (node && node !== element) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        switch (tagName) {
          case "strong":
          case "b":
            activeFormats.add("bold");
            break;
          case "em":
          case "i":
            activeFormats.add("italic");
            break;
          case "u":
            activeFormats.add("underline");
            break;
          case "s":
          case "strike":
            activeFormats.add("strikethrough");
            break;
        }
      }
      node = node.parentNode;
    }

    // Méthode 3: Analyser les styles CSS appliqués
    const startNode = range.startContainer;
    if (startNode.nodeType === Node.TEXT_NODE && startNode.parentNode) {
      const parentElement = startNode.parentNode as HTMLElement;
      const computedStyle = window.getComputedStyle(parentElement);

      if (
        computedStyle.fontWeight === "bold" ||
        parseInt(computedStyle.fontWeight) >= 600
      ) {
        activeFormats.add("bold");
      }
      if (computedStyle.fontStyle === "italic") {
        activeFormats.add("italic");
      }
      if (computedStyle.textDecoration.includes("underline")) {
        activeFormats.add("underline");
      }
      if (computedStyle.textDecoration.includes("line-through")) {
        activeFormats.add("strikethrough");
      }
    }

    return activeFormats;
  };

  // Gérer la sélection de texte pour le menu de formatage
  const handleTextSelection = (blockId: string, element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      hideFormattingMenu();
      return;
    }

    const range = selection.getRangeAt(0);

    // Vérifier si la sélection est dans l'élément
    if (!element.contains(range.commonAncestorContainer)) {
      hideFormattingMenu();
      return;
    }

    // Vérifier s'il y a du texte sélectionné
    if (range.toString().trim() === "") {
      hideFormattingMenu();
      return;
    }

    // Calculer la position du menu
    const rect = range.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    // Positionner le menu au-dessus de la sélection
    const menuX = rect.left + rect.width / 2;
    const menuY = elementRect.top - 50; // 50px au-dessus de l'élément

    // Analyser les formats actifs directement depuis le DOM
    const activeFormats = analyzeActiveFormats(element);

    formattingMenu.value = {
      isVisible: true,
      position: { x: menuX, y: menuY },
      blockId,
      selection: null, // On n'utilise plus les positions de caractères
      activeFormats,
    };
  };

  // Masquer le menu de formatage
  const hideFormattingMenu = () => {
    formattingMenu.value.isVisible = false;
    formattingMenu.value.blockId = null;
    formattingMenu.value.selection = null;
    formattingMenu.value.activeFormats.clear();
  };

  // Appliquer le formatage au texte sélectionné avec toggle
  const applyFormatting = (
    format: "bold" | "italic" | "underline" | "strikethrough",
    updateContentCallback: (
      blockId: string,
      htmlContent: string,
      isHtml: boolean
    ) => void
  ) => {
    const { blockId } = formattingMenu.value;
    if (!blockId) return;

    const element = document.querySelector(
      `[data-block-id="${blockId}"] [contenteditable]`
    ) as HTMLElement;

    if (!element) return;

    // Vérifier si le format est déjà actif pour le toggle
    const isFormatActive = document.queryCommandState(
      format === "strikethrough" ? "strikeThrough" : format
    );

    // Utiliser les commandes DOM pour appliquer le formatage
    if (isFormatActive) {
      // Toggle OFF - supprimer le formatage spécifique
      switch (format) {
        case "bold":
          document.execCommand("bold", false);
          break;
        case "italic":
          document.execCommand("italic", false);
          break;
        case "underline":
          document.execCommand("underline", false);
          break;
        case "strikethrough":
          document.execCommand("strikeThrough", false);
          break;
      }
    } else {
      // Toggle ON - ajouter le formatage
      switch (format) {
        case "bold":
          document.execCommand("bold", false);
          break;
        case "italic":
          document.execCommand("italic", false);
          break;
        case "underline":
          document.execCommand("underline", false);
          break;
        case "strikethrough":
          document.execCommand("strikeThrough", false);
          break;
      }
    }

    // Mettre à jour le contenu après le formatage
    const htmlContent = element.innerHTML;
    updateContentCallback(blockId, htmlContent, true);

    // Mettre à jour les formats actifs après le changement
    nextTick(() => {
      const updatedActiveFormats = analyzeActiveFormats(element);
      formattingMenu.value.activeFormats = updatedActiveFormats;
    });

    hideFormattingMenu();
  };

  // Vérifier si un format est actif
  const isFormatActive = (format: string): boolean => {
    return formattingMenu.value.activeFormats.has(format);
  };

  return {
    // État
    formattingMenu: readonly(formattingMenu),

    // Méthodes
    analyzeActiveFormats,
    handleTextSelection,
    hideFormattingMenu,
    applyFormatting,
    isFormatActive,
  };
};
