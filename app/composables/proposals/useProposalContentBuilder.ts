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
  content_json?: ProposalComponent[] | null;
  content_html?: string | null;
  status: "draft" | "awaiting_client" | "revision_requested" | "completed";
}

interface ProposalContentBuilderCallbacks {
  onSave: (content_json: ProposalComponent[], content_html: string) => void;
}

export const useProposalContentBuilder = (
  props: ProposalContentBuilderProps,
  callbacks: ProposalContentBuilderCallbacks
) => {
  // Modal state
  const isOpen = ref(false);

  // Components state
  const components = ref<ProposalComponent[]>([]);
  const nextId = ref(1);

  // Selection and configuration state
  const selectedComponentId = ref<string | null>(null);
  const configDrawerOpen = ref(false);
  const isPreviewMode = ref(false);

  // Initialize components from content_json if exists
  const initializeComponents = () => {
    if (props.content_json && Array.isArray(props.content_json)) {
      // Create a deep copy to avoid reference issues
      components.value = JSON.parse(JSON.stringify(props.content_json));
      const maxId = Math.max(
        ...props.content_json.map((c) => parseInt(c?.id || "0")),
        0
      );
      nextId.value = maxId + 1;
      return;
    }

    // Initialize empty
    components.value = [];
    nextId.value = 1;
  };

  // Watch for changes in props to update values
  watch(() => props.content_json, initializeComponents, { immediate: true });

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
    if (components.value.length === 0) {
      return "Créer le contenu de la proposition";
    }

    const firstTitle = components.value.find(
      (c) => c.type === "title"
    )?.content;
    if (firstTitle) {
      return firstTitle.length > 50
        ? firstTitle.substring(0, 50) + "..."
        : firstTitle;
    }

    const firstText = components.value.find(
      (c) => c.type === "paragraph"
    )?.content;
    return firstText
      ? firstText.length > 80
        ? firstText.substring(0, 80) + "..."
        : firstText
      : "Contenu de la proposition";
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

  // Computed for preview HTML
  const previewHtml = computed(() => {
    return generateHtml(components.value);
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
      return;
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
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (
      currentIndex === -1 ||
      targetIndex < 0 ||
      targetIndex >= components.value.length
    ) {
      return;
    }

    // Swap components
    const temp = components.value[currentIndex]!;
    components.value[currentIndex] = components.value[targetIndex]!;
    components.value[targetIndex] = temp;

    // Update order values
    components.value.forEach((comp, idx) => {
      comp.order = idx + 1;
    });
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

  // Generate HTML from components
  const generateHtml = (components: ProposalComponent[]): string => {
    // Wrapper div with exact same classes as template
    const wrapperStart =
      '<div class="prose prose-lg max-w-none dark:prose-invert">';
    const wrapperEnd = "</div>";

    const content = components
      .sort((a, b) => a.order - b.order)
      .map((component) => {
        // Get alignment class exactly as in template
        const getAlignmentClass = (alignment: "left" | "center" | "right") => {
          switch (alignment) {
            case "center":
              return "text-center";
            case "right":
              return "text-right";
            default:
              return "text-left";
          }
        };

        const alignmentClass = getAlignmentClass(component.alignment);
        const wrapperClasses = `mb-6 ${alignmentClass}`;

        switch (component.type) {
          case "title": {
            const titleComp = component as TitleComponent;

            if (titleComp.level === 1) {
              return `<div class="${wrapperClasses}"><h1 class="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">${titleComp.content}</h1></div>`;
            } else if (titleComp.level === 2) {
              return `<div class="${wrapperClasses}"><h2 class="text-3xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">${titleComp.content}</h2></div>`;
            } else {
              return `<div class="${wrapperClasses}"><h3 class="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">${titleComp.content}</h3></div>`;
            }
          }

          case "paragraph": {
            const paraComp = component as ParagraphComponent;
            return `<div class="${wrapperClasses}"><p class="text-neutral-700 dark:text-neutral-300 leading-relaxed text-lg">${paraComp.content}</p></div>`;
          }

          case "list": {
            const listComp = component as ListComponent;
            const listClasses =
              "list-inside space-y-2 text-neutral-700 dark:text-neutral-300 text-lg";
            const items = listComp.items
              .map((item) => `<li>${item}</li>`)
              .join("");

            if (listComp.listType === "numbered") {
              return `<div class="${wrapperClasses}"><ol class="list-decimal ${listClasses}">${items}</ol></div>`;
            } else {
              return `<div class="${wrapperClasses}"><ul class="list-disc ${listClasses}">${items}</ul></div>`;
            }
          }

          case "button": {
            const buttonComp = component as ButtonComponent;

            // Create button classes based on variant and size (simulate UButton styles)
            const getButtonClasses = (variant: string, size: string) => {
              const baseClasses =
                "inline-flex items-center justify-center gap-x-2 rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

              // Size classes
              const sizeClasses = {
                xs: "h-6 px-2 text-xs",
                sm: "h-7 px-2.5 text-xs",
                md: "h-8 px-3 text-sm",
                lg: "h-9 px-3.5 text-sm",
                xl: "h-10 px-4 text-base",
              };

              // Variant classes
              const variantClasses = {
                solid:
                  "bg-primary-500 text-white hover:bg-primary-600 focus-visible:outline-primary-500",
                outline:
                  "border border-primary-500 text-primary-500 hover:bg-primary-50 focus-visible:outline-primary-500",
                ghost:
                  "text-primary-500 hover:bg-primary-50 focus-visible:outline-primary-500",
                link: "text-primary-500 underline-offset-4 hover:underline focus-visible:outline-primary-500",
              };

              return `${baseClasses} ${
                sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md
              } ${
                variantClasses[variant as keyof typeof variantClasses] ||
                variantClasses.solid
              }`;
            };

            const buttonClasses = getButtonClasses(
              buttonComp.variant,
              buttonComp.size
            );
            const href = buttonComp.link ? ` href="${buttonComp.link}"` : "";
            const target = buttonComp.link ? ' target="_blank"' : "";

            return `<div class="my-6 ${alignmentClass}"><a${href}${target} class="${buttonClasses}">${buttonComp.text}</a></div>`;
          }

          case "separator": {
            const sepComp = component as SeparatorComponent;

            // Get spacing classes exactly as in template
            const getSeparatorSpacingClass = (
              spacing: "small" | "medium" | "large"
            ) => {
              switch (spacing) {
                case "small":
                  return "py-2";
                case "large":
                  return "py-8";
                default:
                  return "py-4";
              }
            };

            const spacingClass = getSeparatorSpacingClass(sepComp.spacing);

            if (sepComp.style === "space") {
              return `<div class="${spacingClass}"><div class="w-full"></div></div>`;
            } else if (sepComp.style === "ornament") {
              return `<div class="${spacingClass}"><div class="flex items-center justify-center"><div class="flex items-center space-x-2 text-neutral-400"><div class="w-2 h-2 bg-current rounded-full"></div><div class="w-2 h-2 bg-current rounded-full"></div><div class="w-2 h-2 bg-current rounded-full"></div></div></div></div>`;
            } else {
              // Line, dashed, or dotted
              const hrClasses = "border-neutral-300 dark:border-neutral-600";
              const styleClass =
                sepComp.style === "dashed"
                  ? "border-dashed"
                  : sepComp.style === "dotted"
                  ? "border-dotted border-2"
                  : "";

              return `<div class="${spacingClass}"><hr class="${hrClasses} ${styleClass}"></div>`;
            }
          }

          default:
            return "";
        }
      })
      .join("");

    return wrapperStart + content + wrapperEnd;
  };

  // Modal methods
  const openModal = () => {
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
    // Generate HTML from components
    const htmlContent = generateHtml(components.value);

    // Call the callback with the updated values
    callbacks.onSave(components.value, htmlContent);

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
    components: readonly(components),
    sortedComponents,
    selectedComponentId: readonly(selectedComponentId),
    selectedComponent,
    configDrawerOpen,
    isPreviewMode: readonly(isPreviewMode),

    // Computed
    contentPreview,
    previewHtml,
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
