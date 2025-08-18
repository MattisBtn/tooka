import type {
  ButtonComponent,
  ListComponent,
  ParagraphComponent,
  PortfolioComponent,
  PricingComponent,
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
                  "bg-primary text-white hover:bg-primary focus-visible:outline-primary",
                outline:
                  "border border-primary text-primary hover:bg-primary-50 focus-visible:outline-primary",
                ghost:
                  "text-primary hover:bg-primary-50 focus-visible:outline-primary",
                link: "text-primary underline-offset-4 hover:underline focus-visible:outline-primary",
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

          case "pricing": {
            const priceComp = component as PricingComponent;

            const currency = priceComp.currency || "EUR";
            const format = (n: number) =>
              new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency,
                currencyDisplay: "narrowSymbol",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(n);

            const total = priceComp.items.reduce(
              (sum, it) => sum + it.quantity * it.unitPrice,
              0
            );

            const isForfait = priceComp.mode === "forfait";
            const isPack = priceComp.mode === "pack";

            const header = `
<thead>
  <tr class="text-left text-neutral-600 dark:text-neutral-300">
    <th class="py-2 px-3">Prestation</th>
    ${isForfait ? "" : '<th class="py-2 px-3">Qté</th>'}
    ${isForfait ? "" : '<th class="py-2 px-3">PU HT</th>'}
    <th class="py-2 px-3 text-right">Total HT</th>
  </tr>
</thead>`;

            const rows = priceComp.items
              .map((it) => {
                const lineTotal = it.quantity * it.unitPrice;
                const name = `<div class="font-medium text-neutral-900 dark:text-neutral-100">${it.name}</div>`;
                const desc = it.description
                  ? `<div class="text-sm text-neutral-600 dark:text-neutral-400">${it.description}</div>`
                  : "";
                return `
  <tr class="border-t border-neutral-200 dark:border-neutral-700">
    <td class="py-3 px-3 align-top">${name}${desc}</td>
    ${isForfait ? "" : `<td class="py-3 px-3 align-top">${it.quantity}</td>`}
    ${
      isForfait
        ? ""
        : `<td class="py-3 px-3 align-top">${format(it.unitPrice)}</td>`
    }
    <td class="py-3 px-3 align-top text-right">${format(lineTotal)}</td>
  </tr>`;
              })
              .join("");

            const footer = `
<tfoot>
  <tr class="border-t-2 border-neutral-300 dark:border-neutral-600">
    <td class="py-3 px-3 font-semibold" ${
      isForfait ? "colspan=2" : "colspan=3"
    }>Total HT</td>
    <td class="py-3 px-3 text-right font-semibold">${format(total)}</td>
  </tr>
</tfoot>`;

            const packNote = isPack
              ? '<div class="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Pack de photos (ex: 10, 20, 30...). Ajustez la quantité (nb de photos) et le PU HT (prix par photo).</div>'
              : "";

            return `
<div class="${wrapperClasses}">
  <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
    <table class="w-full text-sm">
      ${header}
      <tbody>${rows}</tbody>
      ${footer}
    </table>
  </div>
  ${packNote}
</div>`;
          }

          case "portfolio": {
            const port = component as PortfolioComponent;
            const items = (port.items || []).slice(0, 6);
            const cards = items
              .map((it) => {
                const meta = [it.title, it.category]
                  .filter(Boolean)
                  .map((m) => `<div class="truncate">${m}</div>`)
                  .join("");
                return `
  <div class="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
    <img src="${
      it.previewUrl || it.url
    }" alt="" class="w-full aspect-square object-cover" />
    ${
      meta
        ? `<div class="p-2 text-xs text-neutral-700 dark:text-neutral-300">${meta}</div>`
        : ""
    }
  </div>`;
              })
              .join("");

            return `
<div class="${wrapperClasses}">
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${cards}</div>
</div>`;
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
