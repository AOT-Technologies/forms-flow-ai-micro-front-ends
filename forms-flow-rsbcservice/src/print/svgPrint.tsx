import React from "react";
import { printFormatHelper, printCheckHelper } from "../helpers/helperServices";
import formFieldLayout from "./print_layout.json";
import "./svgPrint.scss";

interface SVGPrintProps {
  form: string;
  formAspect: string;
  formLayout: string;
  formType: string;
  values: Record<string, any>;
  impoundLotOperators: any;
  renderStage: string;
  isPreview: boolean;
  isForSubmissionPayload: boolean;
}

export const SVGprint: React.FC<SVGPrintProps> = ({
  form,
  formAspect,
  formLayout,
  formType,
  values,
  impoundLotOperators,
  renderStage,
  isPreview,
  isForSubmissionPayload,
}) => {
  const formFields = formFieldLayout[formLayout]?.[formType];
  const allFormFields = formFieldLayout[formLayout]?.["fields"];
  const viewBox = formFieldLayout[formLayout]?.["viewbox"];

  let svgStyle: React.CSSProperties = {};

  if (Object.keys(values).length) {
    if (renderStage === "stageTwo" && isForSubmissionPayload) {
      if (formLayout === "TwelveHour") {
        svgStyle = { marginTop: "28px" };
      } else if (formLayout === "TwentyFourHour") {
        svgStyle = {
          marginLeft: "0px",
          marginRight: "0px",
          marginTop: "28px",
          marginBottom: "0px",
        };
      } else if (formLayout === "VI") {
        svgStyle = isPreview
          ? {
              marginLeft: "0px",
              marginRight: "0px",
              marginTop: "50px",
              marginBottom: "40px",
            }
          : {
              marginLeft: "-430px",
              marginRight: "-280px",
              marginTop: "50px",
              marginBottom: "40px",
            };
      }
    }

    return (
      <div style={svgStyle}>
        <svg
          viewBox={viewBox}
          xmlns="http://www.w3.org/2000/svg"
          className={"svg-wrapper" + formAspect}
        >
          <image href={form} width="223" height="202" />
          {formFields?.map((item: string) => {
            const fieldKey = item;
            const field = allFormFields?.[item];
            if (!field) return null;

            if (field["field_type"] === "text") {
              return (
                <text
                  key={fieldKey}
                  id={item}
                  x={`${field["start"]["x"]}px`}
                  y={`${field["start"]["y"]}px`}
                  className={field["classNames"]}
                  fill="black"
                >
                  {printFormatHelper(values, field, item, impoundLotOperators)}
                </text>
              );
            } else if (field["field_type"] === "checkbox") {
              return (
                <text
                  key={fieldKey}
                  id={item}
                  x={field["start"]["x"]}
                  y={field["start"]["y"]}
                  className={field["classNames"]}
                >
                  {printCheckHelper(values, field, item) ? "X" : null}
                </text>
              );
            } else if (field["field_type"] === "always") {
              return (
                <text
                  key={fieldKey}
                  id={item}
                  x={field["start"]["x"]}
                  y={field["start"]["y"]}
                  className={field["classNames"]}
                >
                  {field["field_value"]}
                </text>
              );
            } else if (field["field_type"] === "textArea") {
              return (
                <foreignObject
                  key={fieldKey}
                  id={item}
                  x={`${field["start"]["x"]}px`}
                  y={`${field["start"]["y"]}px`}
                  className={field["classNames"]}
                  fill="black"
                >
                  {printFormatHelper(values, field, item, impoundLotOperators)}
                </foreignObject>
              );
            }
            return null;
          })}
        </svg>
      </div>
    );
  }
  return <div />;
};
