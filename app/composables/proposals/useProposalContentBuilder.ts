// Types pour les components du builder
interface ComponentBase {
  id: string;
  type: string;
  order: number;
  alignment: "left" | "center" | "right";
}

interface TitleComponent extends ComponentBase {
  type: "title";
  content: string;
  level: 1 | 2 | 3; // h1, h2, h3
}

interface ParagraphComponent extends ComponentBase {
  type: "paragraph";
  content: string;
}

interface ListComponent extends ComponentBase {
  type: "list";
  items: string[];
  listType: "bulleted" | "numbered";
}

interface ButtonComponent extends ComponentBase {
  type: "button";
  text: string;
  variant: "solid" | "outline" | "ghost" | "link";
  size: "xs" | "sm" | "md" | "lg" | "xl";
  link?: string;
}

interface SeparatorComponent extends ComponentBase {
  type: "separator";
  style: "line" | "dashed" | "dotted" | "space" | "ornament";
  spacing: "small" | "medium" | "large";
}

type ProposalComponent =
  | TitleComponent
  | ParagraphComponent
  | ListComponent
  | ButtonComponent
  | SeparatorComponent;

interface ProposalContentBuilderProps {
  title: string;
  description?: string | null;
  status: "draft" | "awaiting_client" | "revision_requested" | "completed";
}

interface ProposalContentBuilderCallbacks {
  onSave: (title: string, description: string) => void;
}

export const useProposalContentBuilder = (
  props: ProposalContentBuilderProps,
  callbacks: ProposalContentBuilderCallbacks
) => {
  // Modal state
  const isOpen = ref(false);
  const tempTitle = ref(props.title);

  // Components state
  const components = ref<ProposalComponent[]>([]);
  const nextId = ref(1);

  // Selection and configuration state
  const selectedComponentId = ref<string | null>(null);
  const configDrawerOpen = ref(false);
  const isPreviewMode = ref(false);

  // Initialize components from description if exists
  const initializeComponents = () => {
    if (props.description) {
      try {
        const parsed = JSON.parse(props.description);
        if (Array.isArray(parsed)) {
          components.value = parsed;
          const maxId = Math.max(
            ...parsed.map((c) => parseInt(c?.id || "0")),
            0
          );
          nextId.value = maxId + 1;
          return;
        }
      } catch {
        // If parsing fails, create a paragraph with the description
        components.value = [
          {
            id: "1",
            type: "paragraph",
            content: props.description,
            order: 1,
          } as ParagraphComponent,
        ];
        nextId.value = 2;
        return;
      }
    }

    // Initialize empty
    components.value = [];
    nextId.value = 1;
  };

  // Watch for changes in props to update values
  watch(
    () => props.title,
    (newTitle) => {
      tempTitle.value = newTitle;
    }
  );

  watch(
    () => props.description,
    (newDescription) => {
      if (newDescription !== null) {
        initializeComponents();
      }
    }
  );

  // Available component types
  const availableComponents = [
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
  ];

  // Computed for content preview on button
  const contentPreview = computed(() => {
    if (!props.title && components.value.length === 0) {
      return "Créer le contenu de la proposition";
    }

    if (!props.title) {
      return "Titre requis - Cliquez pour éditer";
    }

    const firstText =
      components.value.find((c) => c.type === "paragraph")?.content ||
      components.value.find((c) => c.type === "title")?.content ||
      "";

    return `${props.title}${
      firstText ? " - " + firstText.substring(0, 50) + "..." : ""
    }`;
  });

  // Computed for status display
  const statusColor = computed(() => {
    switch (props.status) {
      case "draft":
        return "neutral";
      case "awaiting_client":
        return "warning";
      case "revision_requested":
        return "info";
      case "completed":
        return "success";
      default:
        return "neutral";
    }
  });

  const statusLabel = computed(() => {
    switch (props.status) {
      case "draft":
        return "Brouillon";
      case "awaiting_client":
        return "En attente client";
      case "revision_requested":
        return "Révision demandée";
      case "completed":
        return "Acceptée";
      default:
        return "Brouillon";
    }
  });

  // Computed for sorted components
  const sortedComponents = computed(() => {
    return [...components.value].sort((a, b) => a.order - b.order);
  });

  // Computed for selected component
  const selectedComponent = computed(() => {
    if (!selectedComponentId.value) return null;
    return (
      components.value.find((c) => c.id === selectedComponentId.value) || null
    );
  });

  // Component management methods
  const addComponent = (
    type: "title" | "paragraph" | "list" | "button" | "separator"
  ) => {
    const id = nextId.value.toString();
    const order = components.value.length + 1;

    let newComponent: ProposalComponent;

    if (type === "title") {
      newComponent = {
        id,
        type: "title",
        content: "Nouveau titre",
        level: 2,
        order,
        alignment: "left",
      };
    } else if (type === "paragraph") {
      newComponent = {
        id,
        type: "paragraph",
        content: "Nouveau paragraphe...",
        order,
        alignment: "left",
      };
    } else if (type === "list") {
      newComponent = {
        id,
        type: "list",
        items: ["Premier élément", "Deuxième élément"],
        listType: "bulleted",
        order,
        alignment: "left",
      };
    } else if (type === "button") {
      newComponent = {
        id,
        type: "button",
        text: "Cliquez ici",
        variant: "solid",
        size: "md",
        order,
        alignment: "center",
      };
    } else if (type === "separator") {
      newComponent = {
        id,
        type: "separator",
        style: "line",
        spacing: "medium",
        order,
        alignment: "center",
      };
    } else {
      return; // Type non supporté
    }

    components.value.push(newComponent);
    nextId.value++;

    // Auto-select the new component and open config drawer
    selectedComponentId.value = id;
    configDrawerOpen.value = true;
  };

  const removeComponent = (id: string) => {
    const index = components.value.findIndex((c) => c.id === id);
    if (index > -1) {
      components.value.splice(index, 1);
      // Reorder components
      components.value.forEach((comp, idx) => {
        comp.order = idx + 1;
      });

      // Close config drawer if this component was selected
      if (selectedComponentId.value === id) {
        selectedComponentId.value = null;
        configDrawerOpen.value = false;
      }
    }
  };

  const updateComponent = (
    id: string,
    updates: Partial<{
      content: string;
      level: 1 | 2 | 3;
      items: string[];
      listType: "bulleted" | "numbered";
      text: string;
      variant: "solid" | "outline" | "ghost" | "link";
      size: "xs" | "sm" | "md" | "lg" | "xl";
      link: string;
      style: "line" | "dashed" | "dotted" | "space" | "ornament";
      spacing: "small" | "medium" | "large";
      alignment: "left" | "center" | "right";
    }>
  ) => {
    const index = components.value.findIndex((c) => c.id === id);
    if (index > -1) {
      const currentComponent = components.value[index];
      if (!currentComponent) return;

      // Update alignment for all components
      if (updates.alignment !== undefined) {
        currentComponent.alignment = updates.alignment;
      }

      // Update based on component type
      if (currentComponent.type === "title") {
        const titleComponent = currentComponent as TitleComponent;
        if (updates.content !== undefined)
          titleComponent.content = updates.content;
        if (updates.level !== undefined) titleComponent.level = updates.level;
      } else if (currentComponent.type === "paragraph") {
        const paragraphComponent = currentComponent as ParagraphComponent;
        if (updates.content !== undefined)
          paragraphComponent.content = updates.content;
      } else if (currentComponent.type === "list") {
        const listComponent = currentComponent as ListComponent;
        if (updates.items !== undefined) listComponent.items = updates.items;
        if (updates.listType !== undefined)
          listComponent.listType = updates.listType;
      } else if (currentComponent.type === "button") {
        const buttonComponent = currentComponent as ButtonComponent;
        if (updates.text !== undefined) buttonComponent.text = updates.text;
        if (updates.variant !== undefined)
          buttonComponent.variant = updates.variant;
        if (updates.size !== undefined) buttonComponent.size = updates.size;
        if (updates.link !== undefined) buttonComponent.link = updates.link;
      } else if (currentComponent.type === "separator") {
        const separatorComponent = currentComponent as SeparatorComponent;
        if (updates.style !== undefined)
          separatorComponent.style = updates.style;
        if (updates.spacing !== undefined)
          separatorComponent.spacing = updates.spacing;
      }
    }
  };

  const moveComponent = (id: string, direction: "up" | "down") => {
    const currentIndex = components.value.findIndex((c) => c.id === id);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= components.value.length) return;

    // Swap the components in the array
    const currentComponent = components.value[currentIndex];
    const targetComponent = components.value[targetIndex];

    if (currentComponent && targetComponent) {
      components.value[currentIndex] = targetComponent;
      components.value[targetIndex] = currentComponent;

      // Update the order values
      components.value.forEach((comp, idx) => {
        comp.order = idx + 1;
      });
    }
  };

  // Selection methods
  const selectComponent = (id: string) => {
    selectedComponentId.value = id;
    configDrawerOpen.value = true;
  };

  const deselectComponent = () => {
    selectedComponentId.value = null;
    configDrawerOpen.value = false;
  };

  // Modal methods
  const openModal = () => {
    // Initialize temp values with current props
    tempTitle.value = props.title;
    initializeComponents();
    isOpen.value = true;
  };

  const closeModal = () => {
    isOpen.value = false;
    // Reset selection state
    selectedComponentId.value = null;
    configDrawerOpen.value = false;
  };

  const saveAndClose = () => {
    // Serialize components to JSON for storage
    const serializedComponents = JSON.stringify(components.value);

    // Call the callback with the updated values
    callbacks.onSave(tempTitle.value, serializedComponents);

    // Close modal
    closeModal();

    // Show success message
    const toast = useToast();
    toast.add({
      title: "Contenu sauvegardé",
      description: "Le contenu de la proposition a été mis à jour.",
      icon: "i-lucide-check-circle",
      color: "success",
    });
  };

  // Preview mode methods
  const togglePreviewMode = () => {
    isPreviewMode.value = !isPreviewMode.value;
    // Close config drawer when entering preview mode
    if (isPreviewMode.value) {
      selectedComponentId.value = null;
      configDrawerOpen.value = false;
    }
  };

  return {
    // State
    isOpen: readonly(isOpen),
    tempTitle,
    components: readonly(components),
    sortedComponents,
    selectedComponentId: readonly(selectedComponentId),
    selectedComponent,
    configDrawerOpen,
    isPreviewMode: readonly(isPreviewMode),

    // Computed
    contentPreview,
    statusColor,
    statusLabel,
    availableComponents,

    // Methods
    openModal,
    closeModal,
    saveAndClose,
    addComponent,
    removeComponent,
    updateComponent,
    moveComponent,
    selectComponent,
    deselectComponent,
    togglePreviewMode,
  };
};

// Export types for use in components
export type {
  ButtonComponent,
  ListComponent,
  ParagraphComponent,
  ProposalComponent,
  SeparatorComponent,
  TitleComponent,
};
