import type { NotionBlock } from "./useNotionBlocks";

export const useNotionUtils = () => {
  // Générer HTML
  const toHtml = (blocks: readonly NotionBlock[]) => {
    return blocks
      .map((block) => {
        const content = block.htmlContent || block.content || "";

        switch (block.type) {
          case "h1":
            return `<h1>${content}</h1>`;
          case "h2":
            return `<h2>${content}</h2>`;
          case "h3":
            return `<h3>${content}</h3>`;
          case "bulleted-list":
            return `<ul><li>${content}</li></ul>`;
          case "numbered-list":
            return `<ol><li>${content}</li></ol>`;
          case "divider":
            return `<hr />`;
          default:
            return `<p>${content}</p>`;
        }
      })
      .join("");
  };

  // Générer JSON
  const toJson = (blocks: readonly NotionBlock[]) => {
    return blocks;
  };

  // Calculer l'index pour les listes numérotées
  const getNumberedIndex = (
    blockId: string,
    blocks: readonly NotionBlock[]
  ) => {
    let index = 1;
    const currentIndex = blocks.findIndex((b) => b.id === blockId);

    for (let i = 0; i <= currentIndex; i++) {
      if (blocks[i]?.type === "numbered-list") {
        if (i === currentIndex) return index;
        index++;
      } else {
        // Reset compteur si on change de type
        index = 1;
      }
    }

    return index;
  };

  return {
    toHtml,
    toJson,
    getNumberedIndex,
  };
};
