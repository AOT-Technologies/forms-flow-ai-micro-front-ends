import React from "react";
import { useTranslation } from "react-i18next";
import { StepperCheckIcon } from "../SvgIcons";

export interface BundleProgressStepperProps {
  activeStep?: number;
  steps?: string[];
}

const DEFAULT_STEPS = ["Choose forms", "Choose flow", "Configure"];

export const BundleProgressStepper: React.FC<BundleProgressStepperProps> = ({
  activeStep = 0,
  steps = DEFAULT_STEPS,
}) => {
  const { t } = useTranslation();
  const n = steps.length;

  // CSS custom properties drive the two dynamic layout values:
  //   --stepper-track-edge   : left/right inset of the full-span track
  //   --stepper-active-width : width of the progress (filled) track
  const cssVars = {
    "--stepper-track-edge": `${100 / (2 * n)}%`,
    "--stepper-active-width": `${(activeStep / n) * 100}%`,
  } as React.CSSProperties;

  return (
    <div className="bundle-stepper" style={cssVars}>

      {/* Background track */}
      <div className="bundle-stepper__track bundle-stepper__track--bg" />

      {/* Active / progress track — only rendered when past step 0 */}
      {activeStep > 0 && (
        <div className="bundle-stepper__track bundle-stepper__track--active" />
      )}

      {/* Steps */}
      {steps.map((label, index) => {
        const done = index <= activeStep;
        return (
          <div
            key={label}
            className={`bundle-stepper__step${done ? " bundle-stepper__step--done" : ""}`}
          >
            <div className="bundle-stepper__circle">
              <StepperCheckIcon className="bundle-stepper__check" />
            </div>
            <span className="bundle-stepper__label">{t(label)}</span>
          </div>
        );
      })}

    </div>
  );
};
