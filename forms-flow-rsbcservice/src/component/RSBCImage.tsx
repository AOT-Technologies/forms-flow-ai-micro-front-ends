import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactComponent } from '@aot-technologies/formio-react';
import PrintServices from '../print/printService';
import settingsForm from "./RSBCImage.settingsForm";
import _ from "lodash";
import testInput from "../test_data/sampleTestData.json"

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
      //const settingsJsonParsed = JSON.parse(settingsJson);
      //const settingsJsonString = JSON.stringify(settingsJson);
      //const settingsJsonParsed = JSON.parse(settingsJsonString);
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
    let inputData = testInput.data; //TODO - replace this with this.data before going live
    
    if(this.component.rsbcImageSettings){
      try {
        outputJson = this.getOutputJson(this.component.rsbcImageSettings, inputData);
      }
      catch (error) {
            console.error('Error in defining RSBC Image Settings in RSBCImage Component:', error);
        }
    } else {
      outputJson = this.data;
    }

    const isEditMode = this.isPreviewPanelVisible();
    printServices.renderSVGForm(outputJson, this.component, isEditMode, this.builderMode)
      .then((svgComponents) => {
        const root = createRoot(element);
        root.render(
          <div className="rsbc-image-container">
            {svgComponents.map((svg: React.ReactNode, index: number) => (
              <div key={index} className="rsbc-image">
                {svg}
              </div>
            ))}
          </div>
        );
      })
      .catch((error) => {
        console.error('Error rendering SVG form:', error);
      });
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