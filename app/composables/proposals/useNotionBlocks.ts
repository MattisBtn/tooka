export interface NotionBlock {
  id: string;
  type:
    | "text"
    | "h1"
    | "h2"
    | "h3"
    | "bulleted-list"
    | "numbered-list"
    | "divider";
  content: string;
  htmlContent?: string; // Contenu HTML formaté
}

export interface BlockType {
  id: string;
  label: string;
  icon: string;
  description: string;
  type: NotionBlock["type"];
}

export const useNotionBlocks = () => {
  const blocks = ref<NotionBlock[]>([]);
  const focusedBlockId = ref<string | null>(null);
  let nextId = 1;

  // Types de blocs disponibles
  const blockTypes: BlockType[] = [
    {
      id: "text",
      label: "Texte",
      icon: "i-lucide-type",
      description: "Commencez à écrire avec du texte simple",
      type: "text",
    },
    {
      id: "h1",
      label: "Titre 1",
      icon: "i-lucide-heading-1",
      description: "Titre principal de section",
      type: "h1",
    },
    {
      id: "h2",
      label: "Titre 2",
      icon: "i-lucide-heading-2",
      description: "Sous-titre de section",
      type: "h2",
    },
    {
      id: "h3",
      label: "Titre 3",
      icon: "i-lucide-heading-3",
      description: "Titre de sous-section",
      type: "h3",
    },
    {
      id: "bulleted-list",
      label: "Liste à puces",
      icon: "i-lucide-list",
      description: "Créer une liste simple",
      type: "bulleted-list",
    },
    {
      id: "numbered-list",
      label: "Liste numérotée",
      icon: "i-lucide-list-ordered",
      description: "Créer une liste numérotée",
      type: "numbered-list",
    },
    {
      id: "divider",
      label: "Séparateur",
      icon: "i-lucide-minus",
      description: "Ajouter une ligne de séparation",
      type: "divider",
    },
  ];

  // Initialiser avec un bloc vide
  const initialize = () => {
    if (blocks.value.length === 0) {
      blocks.value = [
        {
          id: "1",
          type: "text",
          content: "",
        },
      ];
      nextId = 2;
    }
  };

  // Ajouter un bloc
  const addBlock = (type: NotionBlock["type"] = "text", afterId?: string) => {
    const id = nextId.toString();
    nextId++;

    const newBlock: NotionBlock = {
      id,
      type,
      content: "",
    };

    if (afterId) {
      const index = blocks.value.findIndex((b) => b.id === afterId);
      blocks.value.splice(index + 1, 0, newBlock);
    } else {
      blocks.value.push(newBlock);
    }

    return newBlock;
  };

  // Supprimer un bloc
  const removeBlock = (id: string) => {
    if (blocks.value.length <= 1) return;

    const index = blocks.value.findIndex((b) => b.id === id);
    if (index > -1) {
      blocks.value.splice(index, 1);

      // Focus sur le bloc précédent
      if (index > 0 && blocks.value[index - 1]) {
        focusedBlockId.value = blocks.value[index - 1]!.id;
      } else if (blocks.value.length > 0 && blocks.value[0]) {
        focusedBlockId.value = blocks.value[0]!.id;
      }
    }
  };

  // Mettre à jour le contenu avec gestion du formatage
  const updateContent = (
    id: string,
    content: string,
    isHtml: boolean = false
  ) => {
    const block = blocks.value.find((b) => b.id === id);
    if (block) {
      if (isHtml) {
        block.htmlContent = content;
        block.content = stripHtmlTags(content);

        // Si le contenu est vide, supprimer le formatage HTML
        if (block.content.trim() === "") {
          block.htmlContent = "";
        }
      } else {
        block.content = content;
        // Si on met à jour le contenu texte et qu'il est vide, supprimer le formatage
        if (content.trim() === "") {
          block.htmlContent = "";
        }
      }
    }
  };

  // Changer le type d'un bloc
  const changeBlockType = (id: string, type: NotionBlock["type"]) => {
    const block = blocks.value.find((b) => b.id === id);
    if (block) {
      block.type = type;
    }
  };

  // Focus sur un bloc spécifique
  const focusBlock = (id: string) => {
    focusedBlockId.value = id;
  };

  // Focus sur l'élément DOM d'un bloc
  const focusBlockElement = (blockId: string) => {
    nextTick(() => {
      const element = document.querySelector(
        `[data-block-id="${blockId}"] [contenteditable]`
      ) as HTMLElement;
      if (element) {
        element.focus();

        // Placer le curseur à la fin
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });
  };

  // Déplacer un bloc
  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const [movedBlock] = blocks.value.splice(fromIndex, 1);
    if (movedBlock) {
      blocks.value.splice(toIndex, 0, movedBlock);
    }
  };

  // Fonction utilitaire pour supprimer les balises HTML
  const stripHtmlTags = (html: string): string => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  onMounted(() => {
    initialize();
  });

  return {
    // État
    blocks: readonly(blocks),
    focusedBlockId: readonly(focusedBlockId),
    blockTypes,

    // Méthodes
    addBlock,
    removeBlock,
    updateContent,
    changeBlockType,
    focusBlock,
    focusBlockElement,
    moveBlock,
    stripHtmlTags,
  };
};
