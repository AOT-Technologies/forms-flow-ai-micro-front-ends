import React, { JSX } from "react";
import { formsPNG } from "../helpers/helperServices";
import { SVGprint } from "./svgPrint";
import DBService from "../storage/dbService";
import inputValues from "../test_data/sampleData_VI_24Hour_StageTwo.json";
import impound from "../test_data/impoundLotOperators_VI_StageOne.json";

interface ComponentSettings {
  stage?: string;
}

class PrintServices {
  async renderSVGForm(
      values: Record<string, any>,
      componentSettings: ComponentSettings,
      isEditMode: boolean,
      builderMode: boolean
  ): Promise<JSX.Element[]> {

    //values = inputValues;
    //let impoundLotOperators = impound;
    let impoundLotOperators = await DBService.fetchStaticDataFromTable('impoundLotOperators');
    
    const renderStage = componentSettings.stage || "stageOne";

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
    for (const item in forms) {
      if (forms[item]) {
        for (const formKey in formsPNG?.[renderStage]?.[item] || {}) {
          if (formKey === "ILO" && values["VI"] && values["TwentyFourHour"] && item === "TwentyFourHour") {
            continue;
          }
          if (formKey === "ILO" && values["vehicle_impounded"] === "NO") {
            continue;
          }
          if (formKey === "DETAILS" && values["incident_details"]?.length < 500) {
            continue;
          }

          componentsToRender.push(
              React.createElement(SVGprint, {
                key: `${item}-${formKey}`,
                form: formsPNG?.[renderStage]?.[item]?.[formKey]?.["png"] || "",
                formAspect: formsPNG?.[renderStage]?.[item]?.[formKey]?.["aspectClass"] || "",
                formLayout: item,
                formType: formKey,
                values: valuesCopy,
                impoundLotOperators: impoundLotOperators,
                renderStage: renderStage,
                isPreview: isPreview,
              })
          );
        }
      }
    }
    return componentsToRender;
  }
}

export default PrintServices;