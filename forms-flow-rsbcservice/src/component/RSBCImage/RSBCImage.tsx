import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ReactComponent } from "@aot-technologies/formio-react";
import PrintServices from "../../print/printService";
import settingsForm from "./RSBCImage.settingsForm";
import { toPng } from "html-to-image";
import { renderToString } from "react-dom/server";
import _ from "lodash";
import testInput from "../../test_data/sampleTestData.json";

export default class RSBCImage extends ReactComponent {
  data: any;
  component: any;
  builderMode: boolean;

  constructor(component: any, options: any, data: any) {
    super(component, options, data);
    this.data = data || {};
    this.component = component || {};
  }

  static builderInfo = {
    title: "RSBC Image",
    group: "basic",
    icon: "image",
    documentation: "",
    weight: 70,
    schema: RSBCImage.schema(),
  };

  static schema(): any {
    return {
      type: "rsbcimage",
      label: "RSBC Image",
      key: "rsbcImage",
    };
  }

  static editForm = settingsForm;

  private getTransformedInputData(): any {
    let inputData = this.data;
    //let inputData =  testInput.data;
    return this.component.rsbcImageSettings
      ? this.getOutputJson(this.component.rsbcImageSettings, inputData)
      : inputData;
  }

  getOutputJson(settingsJson: any, inputData: any): any {
    try {
      return _.mapValues(settingsJson, (rule) => {
        if (typeof rule === "string") return _.get(inputData, rule, null);
        if (typeof rule === "object") {
          if (rule.mapping) {
            return _.mapValues(rule.mapping, (path) =>
              typeof path === "object" && path.default !== undefined
                ? path.default
                : _.get(inputData, path, null)
            );
          }
          if (rule.default !== undefined) return rule.default;
        }
        return null;
      });
    } catch (error) {
      console.error("Invalid RSBC Image Settings:", error);
      return {};
    }
  }

  handlePrint = () => {
    const rsbcImages = document.querySelectorAll(".rsbc-image");

    if (rsbcImages.length === 0) {
      console.log("No content to print.");
      return;
    }

    // Create a temporary print container
    const printContainer = document.createElement("div");
    printContainer.id = "print-container";
    printContainer.style.margin = "0";
    printContainer.style.padding = "0";

    // Store original parent and a placeholder for each element
    const originalPositions: {
      element: HTMLElement;
      parent: Node;
      placeholder: HTMLElement;
    }[] = [];

    rsbcImages.forEach((element, index) => {
      if (element instanceof HTMLElement) {
        const parent = element.parentNode as Node;

        // Create a placeholder <span> to mark the original position
        const placeholder = document.createElement("span");
        placeholder.style.display = "none"; // Hide it visually
        parent.insertBefore(placeholder, element);

        originalPositions.push({
          element,
          parent,
          placeholder, // Store placeholder reference
        });

        printContainer.appendChild(element); // Move element to print container
      }
    });

    // Append print container to document body
    document.body.appendChild(printContainer);

    // Apply print styles dynamically
    const printStyles = document.createElement("style");
    printStyles.innerHTML = `
        @media print {
            /* Hide everything except #print-container */
            body * {
                display: none !important;
            }

            #print-container, #print-container * {
                display: block !important;
                visibility: visible !important;
            }

            #print-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: auto;
                margin: 0 !important;
                padding: 0 !important;
            }

            .rsbc-image {
                display: block !important;
                background: white !important;
                width: 100% !important;
                height: auto !important;
            }

            .rsbc-image:not(:first-child) {
                page-break-before: always !important;
            }

            .rsbc-image:last-child {
                page-break-after: avoid !important;
            }

            svg {
                width: 100% !important;
                height: auto !important;
                background: transparent !important;
            }
        }
    `;
    document.head.appendChild(printStyles);

    // Function to show custom Yes/No dialog
    const showConfirmationDialog = () => {
      return new Promise((resolve) => {
        // Create modal container
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "50%";
        modal.style.left = "50%";
        modal.style.transform = "translate(-50%, -50%)";
        modal.style.background = "white";
        modal.style.padding = "20px";
        modal.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
        modal.style.borderRadius = "8px";
        modal.style.zIndex = "10000";
        modal.style.textAlign = "center";

        // Modal text
        const message = document.createElement("p");
        message.innerText = "Did it print successfully?";
        modal.appendChild(message);

        // Yes button
        const yesButton = document.createElement("button");
        yesButton.innerText = "Yes";
        yesButton.style.margin = "10px";
        yesButton.style.padding = "8px 16px";
        yesButton.style.background = "#4CAF50";
        yesButton.style.color = "white";
        yesButton.style.border = "none";
        yesButton.style.cursor = "pointer";
        yesButton.style.borderRadius = "4px";
        yesButton.onclick = () => {
          document.body.removeChild(modal);
          resolve(true);
        };
        modal.appendChild(yesButton);

        // No button
        const noButton = document.createElement("button");
        noButton.innerText = "No";
        noButton.style.margin = "10px";
        noButton.style.padding = "8px 16px";
        noButton.style.background = "#F44336";
        noButton.style.color = "white";
        noButton.style.border = "none";
        noButton.style.cursor = "pointer";
        noButton.style.borderRadius = "4px";
        noButton.onclick = () => {
          document.body.removeChild(modal);
          resolve(false);
        };
        modal.appendChild(noButton);

        // Append modal to body
        document.body.appendChild(modal);
      });
    };

    // Listen for print dialog close event
    const handleAfterPrint = async () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      const userConfirmed = await showConfirmationDialog();
      if (userConfirmed) {
        console.log("User confirmed successful printing.");
      } else {
        console.log("User reported an issue with printing.");
      }
    };

    window.addEventListener("afterprint", handleAfterPrint);

    // Trigger print
    window.print();

    // Restore elements to their exact original position
    setTimeout(() => {
      originalPositions.forEach(({ element, parent, placeholder }) => {
        parent.insertBefore(element, placeholder); // Restore before placeholder
        parent.removeChild(placeholder); // Remove placeholder
      });

      // Cleanup
      document.body.removeChild(printContainer);
      document.head.removeChild(printStyles);
    }, 1000);
  };

  attachReact(element: HTMLElement): void {
    const printServices = new PrintServices();
    if (!printServices?.renderSVGForm) {
      throw new Error("printServices.renderSVGForm is not available.");
    }

    const transformedJson = this.getTransformedInputData();
    const isEditMode = this.isPreviewPanelVisible();

    printServices
      .renderSVGForm(
        transformedJson,
        isEditMode,
        this.builderMode,
        this.component.stage
      )
      .then((svgComponents) => {
        createRoot(element).render(
          <div className="rsbc-image-container">
            {svgComponents.map((svg, index) => (
              <div key={index} className="rsbc-image">
                {svg}
              </div>
            ))}
            <button
              style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
              }}
              onClick={this.handlePrint}
            >
              Print
            </button>
          </div>
        );
      })
      .catch(console.error);
  }

  async getBase64Images(
    stage: string = "stageOne"
  ): Promise<Record<string, string>> {
    try {
      const validStages = ["stageOne", "stageTwo"];
      if (!validStages.includes(stage)) {
        throw new Error(
          `Invalid stage: "${stage}". Expected values: ${validStages.join(
            " or "
          )}.`
        );
      }

      const printServices = new PrintServices();
      if (!printServices?.renderSVGForm) {
        throw new Error("printServices.renderSVGForm is not available.");
      }

      const transformedJson = this.getTransformedInputData();
      const svgImages: Record<string, React.ReactNode> = {};
      const isEditMode = this.isPreviewPanelVisible();

      const svgComponents = await printServices.renderSVGForm(
        transformedJson,
        isEditMode,
        this.builderMode,
        stage
      );
      svgComponents.forEach((svg, index) => {
        if (React.isValidElement(svg)) {
          const element = svg as React.ReactElement<{ id?: string }>;
          const divId = element.props.id || `svg-${index}`;
          svgImages[divId] = svg;
        }
      });

      return this.generateBase64Images(svgImages, transformedJson);
    } catch (error) {
      console.error("Error generating base64 images:", error);
      return {};
    }
  }

  private async generateBase64Images(
    svgImages: Record<string, React.ReactNode>,
    data: any
  ): Promise<Record<string, string>> {
    const base64Images: Record<string, string> = {};
    const imageKeys = ["VI", "TwentyFourHour", "IRP", "TwelveHour"];

    for (const key of imageKeys) {
      if (data[key]) {
        const element = this.convertToHTMLElement(svgImages[key]);
        if (element) {
          this.injectStyles(element);
          document.body.appendChild(element);
          base64Images[`${key}_form_png`] = await this.safeToPng(element);
          document.body.removeChild(element);
        }
      }
    }

    if (data.date_of_impound && data.vehicle_impounded === "NO") {
      base64Images.date_released = data.date_of_impound;
    }
    return base64Images;
  }

  async safeToPng(element: HTMLElement) {
    const originalConsoleError = console.error;
    try {
      console.error = () => {};
      return await toPng(element);
    } catch (error) {
      console.error = originalConsoleError;
      throw error;
    } finally {
      console.error = originalConsoleError;
    }
  }

  injectStyles(element: HTMLElement) {
    const cssText = Array.from(document.styleSheets)
      .filter(
        (sheet) => !sheet.href || sheet.href.startsWith(window.location.origin)
      )
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    const styleElement = document.createElement("style");
    styleElement.textContent = cssText;
    element.prepend(styleElement);
  }

  convertToHTMLElement(jsxElement: React.ReactNode): HTMLElement | null {
    const htmlString = renderToString(jsxElement);
    const doc = new DOMParser().parseFromString(htmlString, "text/html");
    return doc.body.firstElementChild as HTMLElement;
  }

  detachReact(element: HTMLElement): void {
    createRoot(element).unmount();
  }

  isPreviewPanelVisible(): boolean {
    const previewPanel = document.querySelector(
      ".card.panel.preview-panel"
    ) as HTMLElement;
    return previewPanel?.offsetHeight > 0 && previewPanel?.offsetWidth > 0;
  }
}
