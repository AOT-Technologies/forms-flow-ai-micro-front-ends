import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactComponent } from '@aot-technologies/formio-react';
import PrintServices from '../print/printService';
import settingsForm from "./RSBCImage.settingsForm";

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

  attachReact(element: HTMLElement): void {
    const printServices = new PrintServices();
  
    if (!printServices || typeof printServices.renderSVGForm !== 'function') {
      throw new Error('printServices.renderSVGForm is not available.');
    }
  
    const isEditMode = this.isPreviewPanelVisible();
    printServices.renderSVGForm(this.data, this.component, isEditMode, this.builderMode)
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
      const isVisible = previewPanel.offsetHeight > 0 && previewPanel.offsetWidth > 0;
      console.log(isVisible ? 'Preview panel is visible!' : 'Preview panel is not visible.');
      return isVisible;
    } else {
      console.log('Preview panel not found.');
      return false;
    }
  }
}