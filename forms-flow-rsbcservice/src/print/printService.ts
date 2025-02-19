import React, { JSX } from "react";
import { formsPNG } from "../helpers/helperServices";
import { SVGprint } from "./svgPrint";
import DBService from "../storage/dbService";

interface ComponentSettings {
  stage?: string;
}

class PrintServices {
  // Generates an array of SVG components based on form data and print settings.
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
    let isPreview = isEditMode;
    if (!isPreview && builderMode) {
      isPreview = true;
    }

    const forms = {
      TwentyFourHour: values["TwentyFourHour"],
      TwelveHour: values["TwelveHour"],
      VI: values["VI"],
    };

    const valuesCopy = { ...values };
    if (values["vehicle_impounded"] === "YES") {
      valuesCopy["date_released"] = null;
      valuesCopy["time_released"] = null;
    }

    const componentsToRender: JSX.Element[] = [];
    let components = [];
    for (const item in forms) {
      if (forms[item]) {
        for (const formKey in formsPNG?.[renderStage]?.[item] || {}) {
          if (
            formKey === "ILO" &&
            values["VI"] &&
            values["TwentyFourHour"] &&
            item === "TwentyFourHour"
          ) {
            continue;
          }
          if (formKey === "ILO" && values["vehicle_impounded"] === "NO") {
            continue;
          }
          if (
            formKey === "DETAILS" &&
            values["incident_details"]?.length < 500
          ) {
            continue;
          }

          components.push(
            React.createElement(SVGprint, {
              key: `${item}-${formKey}`,
              form: formsPNG?.[renderStage]?.[item]?.[formKey]?.["png"] || "",
              formAspect:
                formsPNG?.[renderStage]?.[item]?.[formKey]?.["aspectClass"] ||
                "",
              formLayout: item,
              formType: formKey,
              values: valuesCopy,
              impoundLotOperators: impoundLotOperators,
              renderStage: renderStage,
              isPreview: isPreview,
              isForSubmissionPayload: isForSubmissionPayload,
            })
          );
        }
        componentsToRender.push(
          React.createElement("div", { id: item, key: item }, components)
        );
        components = [];
      }
    }
    return componentsToRender;
  }
}

export default PrintServices;
