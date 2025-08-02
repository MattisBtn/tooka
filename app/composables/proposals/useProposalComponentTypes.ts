// Base component interface
export interface ComponentBase {
  id: string;
  type: string;
  order: number;
  alignment: "left" | "center" | "right";
}

// Title component
export interface TitleComponent extends ComponentBase {
  type: "title";
  content: string;
  level: 1 | 2 | 3; // h1, h2, h3
}

// Paragraph component
export interface ParagraphComponent extends ComponentBase {
  type: "paragraph";
  content: string;
}

// List component
export interface ListComponent extends ComponentBase {
  type: "list";
  items: string[];
  listType: "bulleted" | "numbered";
}

// Button component
export interface ButtonComponent extends ComponentBase {
  type: "button";
  text: string;
  variant: "solid" | "outline" | "ghost" | "link";
  size: "xs" | "sm" | "md" | "lg" | "xl";
  link?: string;
}

// Separator component
export interface SeparatorComponent extends ComponentBase {
  type: "separator";
  style: "line" | "dashed" | "dotted" | "space" | "ornament";
  spacing: "small" | "medium" | "large";
}

// Union type for all components
export type ProposalComponent =
  | TitleComponent
  | ParagraphComponent
  | ListComponent
  | ButtonComponent
  | SeparatorComponent;

// Available component types
export const AVAILABLE_COMPONENTS = [
  {
    type: "title",
    label: "Titre",
    icon: "i-lucide-heading",
    description: "Ajouter un titre (H1, H2, H3)",
  },
  {
    type: "paragraph",
    label: "Paragraphe",
    icon: "i-lucide-type",
    description: "Ajouter un paragraphe de texte",
  },
  {
    type: "list",
    label: "Liste",
    icon: "i-lucide-list",
    description: "Ajouter une liste à puces ou numérotée",
  },
  {
    type: "button",
    label: "Bouton",
    icon: "i-lucide-mouse-pointer-click",
    description: "Ajouter un bouton d'action",
  },
  {
    type: "separator",
    label: "Séparateur",
    icon: "i-lucide-minus",
    description: "Ajouter un séparateur visuel",
  },
] as const;

// Component type helpers
export const getComponentIcon = (type?: string) => {
  switch (type) {
    case "title":
      return "i-lucide-heading";
    case "paragraph":
      return "i-lucide-type";
    case "list":
      return "i-lucide-list";
    case "button":
      return "i-lucide-mouse-pointer-click";
    case "separator":
      return "i-lucide-minus";
    default:
      return "i-lucide-settings";
  }
};

export const getComponentLabel = (type?: string) => {
  switch (type) {
    case "title":
      return "Titre";
    case "paragraph":
      return "Paragraphe";
    case "list":
      return "Liste";
    case "button":
      return "Bouton";
    case "separator":
      return "Séparateur";
    default:
      return "Composant";
  }
};
