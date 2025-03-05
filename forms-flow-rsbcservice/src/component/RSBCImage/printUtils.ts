// Moves elements to a dedicated print container
export const moveElementsToPrintContainer = async (
  elements: NodeListOf<Element>
) => {
  let printContainer = document.getElementById("print-container");
  if (!printContainer) {
    printContainer = document.createElement("div");
    printContainer.id = "print-container";
    document.body.appendChild(printContainer);
  }

  const clonedElements: HTMLElement[] = [];

  for (const element of Array.from(elements)) {
    if (element instanceof HTMLElement) {
      const clone = element.cloneNode(true) as HTMLElement;

      // Convert the <image> inside <svg> to Base64
      const svgElement = clone.querySelector("svg");
      if (svgElement) {
        const imageElement = svgElement.querySelector("image");
        if (imageElement) {
          const href = imageElement.getAttribute("href");
          if (href) {
            try {
              const base64Data = await convertImageToBase64(href);
              imageElement.setAttribute("href", base64Data);
            } catch (error) {
              console.error("Error converting image to Base64:", error);
            }
          }
        }
      }

      clonedElements.push(clone);
      printContainer.appendChild(clone);
    }
  }

  return { printContainer, clonedElements };
};

export const convertImageToBase64 = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Canvas context is not available"));
      }
    };

    img.onerror = (err) => reject(err);
  });
};

// Remove cloned elements from print container after printing
export const removeElementsFromPrintContainer = (
  clonedElements: HTMLElement[],
  printContainer: HTMLElement
) => {
  clonedElements.forEach((clone) => {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  });

  if (printContainer.parentNode) {
    printContainer.parentNode.removeChild(printContainer);
  }
};
