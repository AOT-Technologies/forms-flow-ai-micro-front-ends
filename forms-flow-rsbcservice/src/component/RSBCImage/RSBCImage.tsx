import React from "react";
import { createRoot } from "react-dom/client";
import { ReactComponent } from "@aot-technologies/formio-react";
import PrintServices from "../../print/printService";
import settingsForm from "./RSBCImage.settingsForm";
import { toPng } from "html-to-image";
import { renderToString } from "react-dom/server";
import PrintConfirmationDialog from "./PrintConfirmationDialog";
import {
  moveElementsToPrintContainer,
  restoreOriginalPositions,
} from "./printUtils";
import _ from "lodash";
import "./printContainer.scss";

export default class RSBCImage extends ReactComponent {
  data: any;
  component: any;
  builderMode: boolean;
  emit!: (event: string, ...args: any[]) => void;

  constructor(component: any, options: any, data: any) {
    super(component, options, data);
    this.data = data || {};
    this.component = component || {};
  }

  static readonly builderInfo = {
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

  static readonly editForm = settingsForm;
  
  private transformedDataCache: any = null;
  private lastData: any = null;
  private lastSettings: any = null;
  
  private getTransformedInputData(): any {
    // Avoid recomputation if data and settings haven't changed
    if (
      this.transformedDataCache &&
      _.isEqual(this.data, this.lastData) &&
      _.isEqual(this.component.rsbcImageSettings, this.lastSettings)
    ) {      
      return this.transformedDataCache;
    }

    // Store current state for future comparison
    this.lastData = _.cloneDeep(this.data);
    this.lastSettings = _.cloneDeep(this.component.rsbcImageSettings);

    // Compute new transformed data
    this.transformedDataCache = this.component.rsbcImageSettings
      ? this.getOutputJson(this.component.rsbcImageSettings, this.data)
      : this.data;    
    return this.transformedDataCache;
  }

  // Maps input data to the settings JSON, transforming it accordingly.
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

  // Manages the print workflow, including a confirmation dialog and form input locking.
  handlePrint = async (values?: any) => {
    const rsbcImages = document.querySelectorAll(".rsbc-image");

    if (rsbcImages.length === 0) {
      console.log("No content to print.");
      return;
    }

    const showConfirmationDialog = (
      message: string,
      primaryBtnCaption: string,
      secondaryBtnCaption: string
    ) => {
      return new Promise<boolean>((resolve) => {
        if (document.querySelector(".modal-overlay")) return; // Prevent multiple instances

        const modalContainer = document.createElement("div");
        document.body.appendChild(modalContainer);

        const handleClose = (result: boolean) => {
          resolve(result);
          document.body.removeChild(modalContainer);
        };

        createRoot(modalContainer).render(
          <PrintConfirmationDialog
            message={message}
            onConfirm={() => handleClose(true)}
            onCancel={() => handleClose(false)}
            primaryBtnCaption={primaryBtnCaption}
            secondaryBtnCaption={secondaryBtnCaption}
          />
        );
      });
    };

    const proceedToPrint = await showConfirmationDialog(
      "If you print this form you cannot go back and edit it, please confirm you wish to proceed.",
      "Proceed",
      "Cancel"
    );

    if (proceedToPrint) {
      console.log(
        "User confirmed proceeding to printing step, FormInputs are locked."
      );
      (this as any).emit("lockFormInput", {
        data: "YES",
      });
    } else {
      console.log("User cancel proceeding to printing.");
      (this as any).emit("lockFormInput", {
        data: "NO",
      });
      return;
    }

    const { printContainer, originalPositions } =
      moveElementsToPrintContainer(rsbcImages);

    const handleAfterPrint = async () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      const userConfirmed = await showConfirmationDialog(
        "Did it print successfully?",
        "Yes",
        "No"
      );
      if (userConfirmed) {
        console.log("User confirmed successful printing.");
        (this as any).emit("printResponse", {
          data: "YES",
        });
      } else {
        console.log("User reported an issue with printing.");
        (this as any).emit("printResponse", {
          data: "NO",
        });
      }
    };

    window.addEventListener("afterprint", handleAfterPrint);

    window.print();

    setTimeout(
      () => restoreOriginalPositions(originalPositions, printContainer),
      1000
    );
  };

  // Renders the RSBC Image component within the given HTML element.
  attachReact(element: HTMLElement): void {
    const printServices = new PrintServices();
    if (!printServices?.renderSVGForm) {
      throw new Error("printServices.renderSVGForm is not available.");
    }

    const transformedJson = this.getTransformedInputData();
    const isEditMode = this.isPreviewPanelVisible();
    const isForSubmissionPayload = false;

    printServices
      .renderSVGForm(
        transformedJson,
        isEditMode,
        this.builderMode,
        this.component.stage,
        isForSubmissionPayload
      )
      .then((svgComponents) => {
        createRoot(element).render(
          <div className="rsbc-image-container">
            {svgComponents.map((svg, index) => (
              <div key={'rsbc-image-'+index} className="rsbc-image">
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

  // Generates Base64-encoded images for the given stage.
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
      const isForSubmissionPayload = true;

      const svgComponents = await printServices.renderSVGForm(
        transformedJson,
        isEditMode,
        this.builderMode,
        stage,
        isForSubmissionPayload
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

  // Converts SVG images to Base64 PNGs based on provided data.
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

  // Converts an HTML element to a PNG image while suppressing console errors.
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

  // Injects global styles into an HTML element for consistent rendering.
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

  // Converts a JSX element to an HTML element.
  convertToHTMLElement(jsxElement: React.ReactNode): HTMLElement | null {
    const htmlString = renderToString(jsxElement);
    const doc = new DOMParser().parseFromString(htmlString, "text/html");
    return doc.body.firstElementChild as HTMLElement;
  }

  // Unmounts the React component from the given HTML element.
  detachReact(element: HTMLElement): void {
    createRoot(element).unmount();
  }

  // Checks if the preview panel of form.io form builder is currently visible.
  isPreviewPanelVisible(): boolean {
    const previewPanel = document.querySelector<HTMLElement>(".card.panel.preview-panel");
    return !!previewPanel && previewPanel.offsetHeight > 0 && previewPanel.offsetWidth > 0;
  }
  
}
