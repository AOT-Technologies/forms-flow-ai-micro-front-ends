import React from "react";
import Form from "react-bootstrap/Form";

interface RadioOption {
    label: string;
    onClick: () => void;
  }
  
  interface CustomRadioButtonProps {
    items: RadioOption[];
    dataTestid?: string;
    ariaLabel?: string;
    indexValue?: number; 
  }

export const CustomRadioButton: React.FC<CustomRadioButtonProps> = ({
  items,
  dataTestid = "",
  ariaLabel = "",
  indexValue = 0, 
}) => {
  return (
    <Form className="custom-radio-button"  aria-label={ariaLabel}>
      {items.map((option, index) => (
        <Form.Check
          inline
          label={option.label}
          className=" "
          name="group1"
          type="radio"
          id={`inline-radio-${index + 1}`}
          data-testid={`${dataTestid}-inline-radio-${index + 1}`}
          key={`radio-${index + 1}`}
          defaultChecked={index === indexValue}
          onClick={option.onClick}
        />
      ))}
    </Form>
  );
};

