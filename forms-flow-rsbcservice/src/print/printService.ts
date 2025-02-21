import React, { JSX } from "react";
import { formsPNG } from "../helpers/helperServices";
import { SVGprint } from "./svgPrint";
import DBService from "../storage/dbService";

interface ComponentSettings {
  stage?: string;
}

class PrintServices {
  async renderSVGForm(
    values: Record<string, any>,
    isEditMode: boolean,
    builderMode: boolean,
    renderStage: string,
    isForSubmissionPayload: boolean
  ): Promise<JSX.Element[]> {
    let impoundLotOperators = await DBService.fetchStaticDataFromTable(
      "impoundLotOperators"
    );

    const isPreview = this.determinePreviewMode(isEditMode, builderMode);
    const valuesCopy = this.prepareValuesCopy(values);

    return this.generateComponents(
      valuesCopy,
      impoundLotOperators,
      renderStage,
      isPreview,
      isForSubmissionPayload
    );
  }

  private determinePreviewMode(
    isEditMode: boolean,
    builderMode: boolean
  ): boolean {
    return isEditMode || builderMode;
  }

  private prepareValuesCopy(values: Record<string, any>): Record<string, any> {
    const valuesCopy = { ...values };
    if (values["vehicle_impounded"] === "YES") {
      valuesCopy["date_released"] = null;
      valuesCopy["time_released"] = null;
    }
    return valuesCopy;
  }

  private generateComponents(
    values: Record<string, any>,
    impoundLotOperators: any,
    renderStage: string,
    isPreview: boolean,
    isForSubmissionPayload: boolean
  ): JSX.Element[] {
    const forms = {
      TwentyFourHour: values["TwentyFourHour"],
      TwelveHour: values["TwelveHour"],
      VI: values["VI"],
    };

    const componentsToRender: JSX.Element[] = [];

    for (const item in forms) {
      if (!forms[item]) continue;
      const components = this.generateFormComponents(
        item,
        forms[item],
        values,
        impoundLotOperators,
        renderStage,
        isPreview,
        isForSubmissionPayload
      );
      if (components.length > 0) {
        componentsToRender.push(
          React.createElement("div", { id: item, key: item }, components)
        );
      }
    }

    return componentsToRender;
  }

  private generateFormComponents(
    item: string,
    form: any,
    values: Record<string, any>,
    impoundLotOperators: any,
    renderStage: string,
    isPreview: boolean,
    isForSubmissionPayload: boolean
  ): JSX.Element[] {
    const components: JSX.Element[] = [];

    for (const formKey in formsPNG?.[renderStage]?.[item] || {}) {
      if (this.shouldSkipComponent(formKey, item, values)) continue;
      components.push(
        React.createElement(SVGprint, {
          key: `${item}-${formKey}`,
          form: formsPNG?.[renderStage]?.[item]?.[formKey]?.["png"] || "",
          formAspect:
            formsPNG?.[renderStage]?.[item]?.[formKey]?.["aspectClass"] || "",
          formLayout: item,
          formType: formKey,
          values: values,
          impoundLotOperators: impoundLotOperators,
          renderStage: renderStage,
          isPreview: isPreview,
          isForSubmissionPayload: isForSubmissionPayload,
        })
      );
    }
    return components;
  }

  private shouldSkipComponent(
    formKey: string,
    item: string,
    values: Record<string, any>
  ): boolean {
    return (
      (formKey === "ILO" &&
        values["VI"] &&
        values["TwentyFourHour"] &&
        item === "TwentyFourHour") ||
      (formKey === "ILO" && values["vehicle_impounded"] === "NO") ||
      (formKey === "DETAILS" && values["incident_details"]?.length < 500)
    );
  }
}

export default PrintServices;
