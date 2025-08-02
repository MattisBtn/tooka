import type {
  ButtonComponent,
  ListComponent,
  ParagraphComponent,
  ProposalComponent,
  SeparatorComponent,
  TitleComponent,
} from "./useProposalComponentTypes";

export const useProposalHtmlGenerator = () => {
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
              .map((item: string) => `<li>${item}</li>`)
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

  return {
    generateHtml,
  };
};
