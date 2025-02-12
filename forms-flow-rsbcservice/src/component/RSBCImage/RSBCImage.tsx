import React, { useState } from "react";
import { createRoot } from 'react-dom/client';
import { ReactComponent } from '@aot-technologies/formio-react';
import PrintServices from '../../print/printService';
import settingsForm from "./RSBCImage.settingsForm";
import { toPng } from "html-to-image";
import _ from "lodash";
import testInput from "../../test_data/sampleTestData.json"

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

  getOutputJson(settingsJson: any, inputData: any): any {
    try {      
      const output: Record<string, any> = {};
    
      _.forOwn(settingsJson, (rule, key) => {
          if (typeof rule === 'string') {
              // Direct mapping
              _.set(output, key, _.get(inputData, rule, null));
          } else if (typeof rule === 'object' && rule.mapping) {
              // Nested mapping
              output[key] = {};
              _.forOwn(rule.mapping, (path, nestedKey) => {
                  if (typeof path === 'object' && path.default !== undefined) {
                      // Apply default value if specified
                      output[key][nestedKey] = path.default;
                  } else {
                      output[key][nestedKey] = _.get(inputData, path, null);
                  }
              });
          } else if (typeof rule === 'object' && rule.default !== undefined) {
              // Default values
              _.set(output, key, rule.default);
          }
      });

      return output;

    }
    catch (error) {
      console.error('Error in defining RSBC Image Settings in RSBCImage Component:', error);
      console.error('Error in defining RSBC Image Settings in RSBCImage Component. Needs to be a valid JSON object.');
    }
  }

  attachReact(element: HTMLElement): void {
    const printServices = new PrintServices();
  
    if (!printServices || typeof printServices.renderSVGForm !== 'function') {
      throw new Error('printServices.renderSVGForm is not available.');
    }

    let outputJson:any = {};
    let inputData = this.data;
    inputData = testInput.data;

    if (this.component.rsbcImageSettings) {
      try {
        outputJson = this.getOutputJson(this.component.rsbcImageSettings, inputData);
      } catch (error) {
        console.error('Error in defining RSBC Image Settings in RSBCImage Component:', error);
      }
    } else {
      outputJson = this.data;
    }
    this.component.rsbcImageData = outputJson;
    this.component.rsbcImageData.svgImages = {};

    const isEditMode = this.isPreviewPanelVisible();
    printServices.renderSVGForm(outputJson, this.component, isEditMode, this.builderMode)
      .then((svgComponents) => {
        const root = createRoot(element);
        root.render(
          <div className="rsbc-image-container">
            {svgComponents.map((svg: React.ReactNode, index: number) => {
              if (React.isValidElement(svg)) {
                const element = svg as React.ReactElement<{ id?: string }>;
                const divId = element.props.id || `svg-${index}`;
                this.component.rsbcImageData.svgImages[divId] = svg;
                return (
                  <div key={index} className="rsbc-image" id={divId}>
                    {svg}
                  </div>
                );
              }
              return null;
            })}
          </div>
        );
      })
      .catch((error) => {
        console.error('Error rendering SVG form:', error);
      });
  }

  async getBase64Images(): Promise<Object> {
    console.log("getBase64Images______________");
    try {
      const base64Images: Object = {};

      if (this.component.rsbcImageData["VI"]) {
        const element = this.component.rsbcImageData.svgImages["VI"];
        const base64_png = await toPng(element);
        base64Images["VI_form_png"] = base64_png;
      }
      if (this.component.rsbcImageData["TwentyFourHour"]) {
        const element = this.component.rsbcImageData.svgImages["TwentyFourHour"];
        const base64_png = await toPng(element);
        base64Images["TwentyFourHour_form_png"] = base64_png;
      }
      if (this.component.rsbcImageData["IRP"]) {
        const element = this.component.rsbcImageData.svgImages["IRP"];
        const base64_png = await toPng(element);
        base64Images["IRP_form_png"] = base64_png;
      }
      if (this.component.rsbcImageData["TwelveHour"]) {
        const element = this.component.rsbcImageData.svgImages["TwelveHour"];
        const base64_png = await toPng(element);
        base64Images["TwelveHour_form_png"] = base64_png;
      }
      if (this.component.rsbcImageData["date_of_impound"] && this.component.rsbcImageData["vehicle_impounded"] === "NO") {
        base64Images["date_released"] = this.component.rsbcImageData["date_of_impound"];
      }

      return base64Images;

    } catch (error) {
      console.error("An error occurred submitting the event: ", error);
    }

  }

  detachReact(element: HTMLElement): void {
    if (element) {
      const root = createRoot(element);
      root.unmount();
    }
  }

  isPreviewPanelVisible(): boolean {
    const previewPanel = document.querySelector('.card.panel.preview-panel') as HTMLElement;
    if (previewPanel) {
      return previewPanel.offsetHeight > 0 && previewPanel.offsetWidth > 0;
    } else {
      return false;
    }
  }
}