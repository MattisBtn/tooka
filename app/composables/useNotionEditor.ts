import type {
  NotionBlock,
  NotionBlockType,
  NotionEditorState,
  SlashCommand,
} from "~/types/notion";

export const useNotionEditor = () => {
  // État de l'éditeur
  const state = reactive<NotionEditorState>({
    blocks: [],
    selectedBlockId: null,
    slashMenuOpen: false,
    slashMenuPosition: null,
    slashMenuQuery: "",
  });

  // Commandes disponibles
  const slashCommands: SlashCommand[] = [
    {
      id: "heading1",
      title: "Titre 1",
      description: "Titre principal",
      icon: "i-lucide-heading-1",
      type: "heading1",
      keywords: ["titre", "h1", "principal", "grand"],
    },
    {
      id: "heading2",
      title: "Titre 2",
      description: "Sous-titre",
      icon: "i-lucide-heading-2",
      type: "heading2",
      keywords: ["sous-titre", "h2", "section"],
    },
    {
      id: "heading3",
      title: "Titre 3",
      description: "Titre de section",
      icon: "i-lucide-heading-3",
      type: "heading3",
      keywords: ["h3", "section", "petit"],
    },
    {
      id: "paragraph",
      title: "Paragraphe",
      description: "Texte normal",
      icon: "i-lucide-type",
      type: "paragraph",
      keywords: ["texte", "paragraphe", "normal"],
    },
    {
      id: "bulletList",
      title: "Liste à puces",
      description: "Liste avec puces",
      icon: "i-lucide-list",
      type: "bulletList",
      keywords: ["liste", "puces", "bullet"],
    },
    {
      id: "numberedList",
      title: "Liste numérotée",
      description: "Liste avec numéros",
      icon: "i-lucide-list-ordered",
      type: "numberedList",
      keywords: ["liste", "numérotée", "ordered"],
    },
    {
      id: "quote",
      title: "Citation",
      description: "Bloc de citation",
      icon: "i-lucide-quote",
      type: "quote",
      keywords: ["citation", "quote", "guillemets"],
    },
    {
      id: "code",
      title: "Code",
      description: "Bloc de code",
      icon: "i-lucide-code",
      type: "code",
      keywords: ["code", "programmation", "dev"],
    },
    {
      id: "divider",
      title: "Séparateur",
      description: "Ligne de séparation",
      icon: "i-lucide-minus",
      type: "divider",
      keywords: ["séparateur", "ligne", "divider"],
    },
    {
      id: "image",
      title: "Image",
      description: "Insérer une image",
      icon: "i-lucide-image",
      type: "image",
      keywords: ["image", "photo", "visuel"],
    },
    {
      id: "table",
      title: "Tableau",
      description: "Tableau de données",
      icon: "i-lucide-table",
      type: "table",
      keywords: ["tableau", "table", "données"],
    },
    {
      id: "button",
      title: "Bouton",
      description: "Bouton d'action",
      icon: "i-lucide-mouse-pointer-click",
      type: "button",
      keywords: ["bouton", "button", "action"],
    },
    {
      id: "callout",
      title: "Callout",
      description: "Encadré avec icône",
      icon: "i-lucide-info",
      type: "callout",
      keywords: ["callout", "encadre", "info", "alerte", "note"],
    },
  ];

  // Commandes filtrées selon la recherche
  const filteredCommands = computed(() => {
    if (!state.slashMenuQuery) return slashCommands;

    const query = state.slashMenuQuery.toLowerCase();
    return slashCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        cmd.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    );
  });

  // Initialiser l'éditeur avec du contenu existant
  const initialize = (blocks?: NotionBlock[]) => {
    if (blocks && blocks.length > 0) {
      state.blocks = [...blocks];
    } else {
      // Bloc paragraphe par défaut
      state.blocks = [
        {
          id: generateId(),
          type: "paragraph",
          content: "",
          order: 1,
        },
      ];
    }
  };

  // Générer un ID unique
  const generateId = () =>
    `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Ajouter un nouveau bloc
  const addBlock = (type: NotionBlockType, afterBlockId?: string) => {
    const newBlock: NotionBlock = {
      id: generateId(),
      type,
      content: "",
      order: 0,
    };

    if (!afterBlockId) {
      // Ajouter à la fin
      newBlock.order = state.blocks.length + 1;
      state.blocks.push(newBlock);
    } else {
      // Insérer après le bloc spécifié
      const afterIndex = state.blocks.findIndex((b) => b.id === afterBlockId);
      if (afterIndex !== -1) {
        newBlock.order = afterIndex + 2;
        state.blocks.splice(afterIndex + 1, 0, newBlock);
        // Réordonner les blocs suivants
        for (let i = afterIndex + 2; i < state.blocks.length; i++) {
          const block = state.blocks[i];
          if (block) {
            block.order = i + 1;
          }
        }
      }
    }

    return newBlock;
  };

  // Supprimer un bloc
  const removeBlock = async (blockId: string) => {
    const block = state.blocks.find((b) => b.id === blockId);

    // Si c'est un bloc image, supprimer l'image du storage
    if (block?.type === "image" && block.metadata?.filePath) {
      const { notionImageService } = await import(
        "~/services/notionImageService"
      );
      await notionImageService.deleteImage(block.metadata.filePath as string);
    }

    const index = state.blocks.findIndex((b) => b.id === blockId);
    if (index !== -1) {
      state.blocks.splice(index, 1);
      // Réordonner les blocs restants
      state.blocks.forEach((block, i) => {
        if (block) {
          block.order = i + 1;
        }
      });
    }
  };

  // Mettre à jour un bloc
  const updateBlock = (blockId: string, updates: Partial<NotionBlock>) => {
    const block = state.blocks.find((b) => b.id === blockId);
    if (block) {
      Object.assign(block, updates);
    }
  };

  // Déplacer un bloc
  const moveBlock = (blockId: string, direction: "up" | "down") => {
    const index = state.blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      // Échanger avec le bloc précédent
      const currentBlock = state.blocks[index];
      const previousBlock = state.blocks[index - 1];
      if (currentBlock && previousBlock) {
        [state.blocks[index], state.blocks[index - 1]] = [
          previousBlock,
          currentBlock,
        ];
        currentBlock.order = index;
        previousBlock.order = index + 1;
      }
    } else if (direction === "down" && index < state.blocks.length - 1) {
      // Échanger avec le bloc suivant
      const currentBlock = state.blocks[index];
      const nextBlock = state.blocks[index + 1];
      if (currentBlock && nextBlock) {
        [state.blocks[index], state.blocks[index + 1]] = [
          nextBlock,
          currentBlock,
        ];
        currentBlock.order = index + 2;
        nextBlock.order = index + 1;
      }
    }
  };

  // Gestion du slash menu
  const openSlashMenu = (
    position: { x: number; y: number },
    query: string = ""
  ) => {
    state.slashMenuOpen = true;
    state.slashMenuPosition = position;
    state.slashMenuQuery = query;
  };

  const closeSlashMenu = () => {
    state.slashMenuOpen = false;
    state.slashMenuPosition = null;
    state.slashMenuQuery = "";
  };

  const selectSlashCommand = (command: SlashCommand) => {
    const newBlock = addBlock(command.type, state.selectedBlockId || undefined);
    state.selectedBlockId = newBlock.id;
    closeSlashMenu();
    return newBlock;
  };

  // Sélectionner un bloc
  const selectBlock = (blockId: string) => {
    state.selectedBlockId = blockId;
  };

  const deselectBlock = () => {
    state.selectedBlockId = null;
  };

  // Obtenir le contenu HTML
  const getHtml = () => {
    return state.blocks
      .sort((a, b) => a.order - b.order)
      .map((block) => {
        switch (block.type) {
          case "heading1":
            return `<h1 class="text-4xl font-bold mb-4">${block.content}</h1>`;
          case "heading2":
            return `<h2 class="text-3xl font-semibold mb-3">${block.content}</h2>`;
          case "heading3":
            return `<h3 class="text-2xl font-medium mb-2">${block.content}</h3>`;
          case "paragraph":
            return `<p class="mb-4 leading-relaxed">${block.content}</p>`;
          case "bulletList":
            return `<ul class="list-disc list-inside mb-4 space-y-1">${block.content
              .split("\n")
              .filter((line) => line.trim())
              .map((item) => `<li>${item.trim()}</li>`)
              .join("")}</ul>`;
          case "numberedList":
            return `<ol class="list-decimal list-inside mb-4 space-y-1">${block.content
              .split("\n")
              .filter((line) => line.trim())
              .map((item) => `<li>${item.trim()}</li>`)
              .join("")}</ol>`;
          case "quote":
            return `<blockquote class="border-l-4 border-primary pl-4 italic mb-4">${block.content}</blockquote>`;
          case "code":
            return `<pre class="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mb-4 overflow-x-auto"><code>${block.content}</code></pre>`;
          case "divider":
            return `<hr class="my-6 border-neutral-300 dark:border-neutral-600">`;
          case "image": {
            const imageWidth = block.metadata?.width
              ? `width="${block.metadata.width}"`
              : "";
            const imageHeight = block.metadata?.height
              ? `height="${block.metadata.height}"`
              : "";
            return `<div class="mb-4"><img src="${
              block.content
            }" alt="Image" ${imageWidth} ${imageHeight} class="max-w-full h-auto rounded-lg shadow-sm" /></div>`;
          }
          case "table":
            return `<div class="overflow-x-auto mb-4"><table class="w-full border-collapse border border-neutral-300 dark:border-neutral-600">${block.content}</table></div>`;
          case "button":
            return `<button class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors mb-4">${block.content}</button>`;
          case "callout": {
            const calloutIcon = (block.metadata?.icon as string) || "💡";
            const calloutIconType =
              (block.metadata?.iconType as string) || "emoji";
            const iconHtml =
              calloutIconType === "emoji"
                ? calloutIcon
                : `<svg class="w-4 h-4 lucide lucide-${calloutIcon}"><use href="#lucide-${calloutIcon}"></use></svg>`;
            return `<div class="flex gap-3 p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg mb-4">
              <div class="flex-shrink-0 text-lg">${iconHtml}</div>
              <div class="flex-1">${block.content}</div>
            </div>`;
          }
          default:
            return `<p class="mb-4">${block.content}</p>`;
        }
      })
      .join("");
  };

  return {
    // État
    state: readonly(state),
    blocks: computed(() => state.blocks),
    selectedBlockId: computed(() => state.selectedBlockId),
    slashMenuOpen: computed(() => state.slashMenuOpen),
    slashMenuPosition: computed(() => state.slashMenuPosition),
    slashMenuQuery: computed(() => state.slashMenuQuery),
    filteredCommands,

    // Méthodes
    initialize,
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    selectBlock,
    deselectBlock,
    openSlashMenu,
    closeSlashMenu,
    selectSlashCommand,
    getHtml,
  };
};
