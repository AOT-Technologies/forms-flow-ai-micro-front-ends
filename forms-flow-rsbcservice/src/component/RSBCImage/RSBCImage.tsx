import React, { useState } from "react";
import { createRoot } from 'react-dom/client';
import { ReactComponent } from '@aot-technologies/formio-react';
import PrintServices from '../../print/printService';
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
    title: 'RSBC Image',
    group: 'basic',
    icon: 'image',
    documentation: "",
    weight: 70,
    schema: RSBCImage.schema(),
  };

  static schema(): any {
    return {
      type: 'rsbcimage',
      label: 'RSBC Image',
      key: 'rsbcImage',
    };
  }

  static editForm = settingsForm;

  private getTransformedInputData(): any {
    let inputData = this.data; 
    //let inputData =  testInput.data;
    return this.component.rsbcImageSettings ? 
      this.getOutputJson(this.component.rsbcImageSettings, inputData) : inputData;
  }

  getOutputJson(settingsJson: any, inputData: any): any {
    try {
      return _.mapValues(settingsJson, (rule) => {
        if (typeof rule === 'string') return _.get(inputData, rule, null);
        if (typeof rule === 'object') {
          if (rule.mapping) {
            return _.mapValues(rule.mapping, path => typeof path === 'object' && path.default !== undefined ? path.default : _.get(inputData, path, null));
          }
          if (rule.default !== undefined) return rule.default;
        }
        return null;
      });
    } catch (error) {
      console.error('Invalid RSBC Image Settings:', error);
      return {};
    }
  }

  /*handlePrint = () => {
    const elementsToPrint = document.querySelectorAll(".rsbc-image");

    if (elementsToPrint.length === 0) {
        console.log("No content to print.");
        return;
    }

    // Create a temporary print container
    const printContainer = document.createElement("div");
    printContainer.id = "print-container";

    // Clone elements and append to print container
    elementsToPrint.forEach(element => {
        const clonedElement = element.cloneNode(true) as HTMLElement;
        //printContainer.appendChild(clonedElement);
        printContainer.appendChild(element);
    });

    // Append to document body
    document.body.appendChild(printContainer);

    // Trigger print
    window.print();

    // Remove print container after printing
    setTimeout(() => {
        document.body.removeChild(printContainer);
    }, 1000);
};*/

handlePrint = () => {
  const rsbcImages = document.querySelectorAll(".rsbc-image");

  if (rsbcImages.length === 0) {
      console.log("No content to print.");
      return;
  }

  // Create a temporary print container
  const printContainer = document.createElement("div");
  printContainer.id = "print-container";

  // Store original parent and a placeholder for each element
  const originalPositions: { element: HTMLElement; parent: Node; placeholder: HTMLElement }[] = [];

  rsbcImages.forEach((element) => {
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
          body * {
              visibility: hidden !important;
          }

          #print-container, #print-container * {
              visibility: visible !important;
          }

          #print-container {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: auto;
          }

          .rsbc-image {
              display: block !important;
              page-break-before: always;
              background: white !important;
              width: 100% !important;
              height: auto !important;
          }

          svg {
              width: 100% !important;
              height: auto !important;
              background: transparent !important;
          }
      }
  `;
  document.head.appendChild(printStyles);

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
      throw new Error('printServices.renderSVGForm is not available.');
    }
    
    const transformedJson = this.getTransformedInputData();
    const isEditMode = this.isPreviewPanelVisible();

    printServices.renderSVGForm(transformedJson, isEditMode, this.builderMode, this.component.stage)
      .then((svgComponents) => {
        createRoot(element).render(
          <div className="rsbc-image-container">
            {svgComponents.map((svg, index) => <div key={index} className="rsbc-image">{svg}</div>)}
            <button
              style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
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

  async getBase64Images(stage: string = "stageOne"): Promise<Record<string, string>> {
    try {
      const validStages = ["stageOne", "stageTwo"];
      if (!validStages.includes(stage)) {
        throw new Error(`Invalid stage: "${stage}". Expected values: ${validStages.join(" or ")}.`);
      }

      const printServices = new PrintServices();
      if (!printServices?.renderSVGForm) {
        throw new Error('printServices.renderSVGForm is not available.');
      }
      
      const transformedJson = this.getTransformedInputData();
      const svgImages: Record<string, React.ReactNode> = {};
      const isEditMode = this.isPreviewPanelVisible();

      const svgComponents = await printServices.renderSVGForm(transformedJson, isEditMode, this.builderMode, stage);
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

  private async generateBase64Images(svgImages: Record<string, React.ReactNode>, data: any): Promise<Record<string, string>> {
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
      .filter(sheet => !sheet.href || sheet.href.startsWith(window.location.origin))
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText).join("\n");
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
    const previewPanel = document.querySelector('.card.panel.preview-panel') as HTMLElement;
    return previewPanel?.offsetHeight > 0 && previewPanel?.offsetWidth > 0;
  }
}
