// Types de base pour l'éditeur Notion-like
export interface NotionBlock {
  id: string;
  type: NotionBlockType;
  content: string;
  metadata?: Record<string, unknown>;
  order: number;
}

// Metadata spécifique pour le bloc image
export interface ImageBlockMetadata extends Record<string, unknown> {
  filePath?: string;
  width?: number;
  height?: number;
}

export type NotionBlockType =
  | "heading1"
  | "heading2"
  | "heading3"
  | "paragraph"
  | "bulletList"
  | "numberedList"
  | "quote"
  | "code"
  | "divider"
  | "image"
  | "table"
  | "button"
  | "callout";

// Commandes du slash menu
export interface SlashCommand {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: NotionBlockType;
  keywords: string[];
}

// État de l'éditeur
export interface NotionEditorState {
  blocks: NotionBlock[];
  selectedBlockId: string | null;
  slashMenuOpen: boolean;
  slashMenuPosition: { x: number; y: number } | null;
  slashMenuQuery: string;
}
