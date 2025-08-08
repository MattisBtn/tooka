import type {
  ButtonComponent,
  ListComponent,
  ParagraphComponent,
  PricingComponent,
  ProposalComponent,
  SeparatorComponent,
  TitleComponent,
} from "./useProposalComponentTypes";
import { AVAILABLE_COMPONENTS } from "./useProposalComponentTypes";

export const useProposalComponentManager = () => {
  // Components state
  const components = ref<ProposalComponent[]>([]);
  const nextId = ref(1);

  // Selection and configuration state
  const selectedComponentId = ref<string | null>(null);
  const configDrawerOpen = ref(false);
  const isPreviewMode = ref(false);

  // Initialize components from content_json if exists
  const initializeComponents = (content_json?: ProposalComponent[] | null) => {
    if (content_json && Array.isArray(content_json)) {
      // Create a deep copy to avoid reference issues
      components.value = JSON.parse(JSON.stringify(content_json));
      const maxId = Math.max(
        ...content_json.map((c) => parseInt(c?.id || "0")),
        0
      );
      nextId.value = maxId + 1;
      return;
    }

    // Initialize empty
    components.value = [];
    nextId.value = 1;
  };

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
    type: "title" | "paragraph" | "list" | "button" | "separator" | "pricing"
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
      } as TitleComponent;
    } else if (type === "paragraph") {
      newComponent = {
        id,
        type: "paragraph",
        content: "Nouveau paragraphe...",
        order,
        alignment: "left",
      } as ParagraphComponent;
    } else if (type === "list") {
      newComponent = {
        id,
        type: "list",
        items: ["Premier élément", "Deuxième élément"],
        listType: "bulleted",
        order,
        alignment: "left",
      } as ListComponent;
    } else if (type === "button") {
      newComponent = {
        id,
        type: "button",
        text: "Cliquez ici",
        variant: "solid",
        size: "md",
        order,
        alignment: "center",
      } as ButtonComponent;
    } else if (type === "separator") {
      newComponent = {
        id,
        type: "separator",
        style: "line",
        spacing: "medium",
        order,
        alignment: "center",
      } as SeparatorComponent;
    } else if (type === "pricing") {
      newComponent = {
        id,
        type: "pricing",
        mode: "standard",
        items: [
          {
            name: "Prestation",
            description: "Description",
            quantity: 1,
            unitPrice: 0,
          },
        ],
        currency: "EUR",
        order,
        alignment: "left",
      } as PricingComponent;
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
      // Pricing specific
      mode: "standard" | "forfait" | "pack";
      pricingItems: PricingComponent["items"];
      currency: "EUR" | "USD" | "GBP";
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
      } else if (currentComponent.type === "pricing") {
        const pricingComponent = currentComponent as PricingComponent;
        if (updates.mode !== undefined) pricingComponent.mode = updates.mode;
        if (updates.pricingItems !== undefined)
          pricingComponent.items = updates.pricingItems;
        if (updates.currency !== undefined)
          pricingComponent.currency = updates.currency;
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
    components,
    sortedComponents,
    selectedComponentId: readonly(selectedComponentId),
    selectedComponent,
    configDrawerOpen,
    isPreviewMode: readonly(isPreviewMode),

    // Computed
    availableComponents: AVAILABLE_COMPONENTS,

    // Methods
    initializeComponents,
    addComponent,
    removeComponent,
    updateComponent,
    moveComponent,
    selectComponent,
    deselectComponent,
    togglePreviewMode,
  };
};
