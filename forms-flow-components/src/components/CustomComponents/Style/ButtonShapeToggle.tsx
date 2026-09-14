import React from "react";
import { ButtonShape } from "./themeConstants";

interface ShapeOption {
  key: ButtonShape;
  label: string;
  borderRadius: string;
}

const SHAPES: ShapeOption[] = [
  { key: "square", label: "Square", borderRadius: "4px" },
  { key: "rounded", label: "Rounded", borderRadius: "20px" },
];

interface ButtonShapeToggleProps {
  value: ButtonShape;
  onChange: (key: ButtonShape) => void;
}

const ButtonShapeToggle: React.FC<ButtonShapeToggleProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="ff-btn-shape-toggle" role="radiogroup">
      {SHAPES.map((shape) => {
        const isSelected = value === shape.key;
        return (
          <button
            key={shape.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`ff-btn-shape-toggle__option${isSelected ? " ff-btn-shape-toggle__option--selected" : ""}`}
            style={{ borderRadius: shape.borderRadius }}
            onClick={() => onChange(shape.key)}
          >
            {shape.label}
          </button>
        );
      })}
    </div>
  );
};

export default ButtonShapeToggle;
