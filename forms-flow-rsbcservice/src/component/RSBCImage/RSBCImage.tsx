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
    //let inputData = this.data;
    let inputData =  testInput.data;
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

  attachReact(element: HTMLElement): void {
    const printServices = new PrintServices();
    if (!printServices?.renderSVGForm) {
      throw new Error('printServices.renderSVGForm is not available.');
    }
    
    const transformedJson = this.getTransformedInputData();
    const isEditMode = this.isPreviewPanelVisible();

    printServices.renderSVGForm(transformedJson, this.component, isEditMode, this.builderMode)
      .then((svgComponents) => {
        createRoot(element).render(
          <div className="rsbc-image-container">
            {svgComponents.map((svg, index) => <div key={index} className="rsbc-image">{svg}</div>)}
          </div>
        );
      })
      .catch(console.error);
  }

  async getBase64Images(): Promise<Record<string, string>> {
    try {
      const printServices = new PrintServices();
      if (!printServices?.renderSVGForm) {
        throw new Error('printServices.renderSVGForm is not available.');
      }
      
      const transformedJson = this.getTransformedInputData();
      const svgImages: Record<string, React.ReactNode> = {};
      const isEditMode = this.isPreviewPanelVisible();

      const svgComponents = await printServices.renderSVGForm(transformedJson, this.component, isEditMode, this.builderMode);
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
