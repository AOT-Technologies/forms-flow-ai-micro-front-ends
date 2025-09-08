import React from "react";      

interface StepperProps {
  steps: string[];
  activeStep: number;
  onClick?: (stepIndex: number) => void;
}

export const StepperComponent: React.FC<StepperProps> = ({ steps, activeStep, onClick }) => {
  const defaultFunction = () => {};

  return (
    <div>
      <ol className="ff-stepper">
        {steps.map((label, index) => (
          <li
            key={index}
            className={`ff-step ${
              activeStep > index ? "active " : ""
            } ${onClick ? "cursor-pointer " : "cursor-default "}`}
            onClick={() => (onClick ? onClick(index) : defaultFunction())}
          >
            <span
              className={`ff-step-no ${activeStep >= index ? "active" : ""}`}
            >
              {index + 1}
            </span>
            <span
              className={`ff-step-label ${activeStep >= index ? "active" : ""}`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

