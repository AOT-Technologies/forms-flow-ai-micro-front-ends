export const moveElementsToPrintContainer = (elements: NodeListOf<Element>) => {
  const printContainer = document.createElement("div");
  printContainer.id = "print-container";

  const originalPositions: {
    element: HTMLElement;
    parent: Node;
    placeholder: HTMLElement;
  }[] = [];

  elements.forEach((element) => {
    if (element instanceof HTMLElement) {
      const parent = element.parentNode as Node;
      const placeholder = document.createElement("span");
      placeholder.style.display = "none";
      parent.insertBefore(placeholder, element);

      originalPositions.push({ element, parent, placeholder });

      printContainer.appendChild(element);
    }
  });

  document.body.appendChild(printContainer);
  return { printContainer, originalPositions };
};

export const restoreOriginalPositions = (
  originalPositions: {
    element: HTMLElement;
    parent: Node;
    placeholder: HTMLElement;
  }[],
  printContainer: HTMLElement
) => {
  originalPositions.forEach(({ element, parent, placeholder }) => {
    parent.insertBefore(element, placeholder);
    parent.removeChild(placeholder);
  });

  document.body.removeChild(printContainer);
};
