import React from "react";
import Form from "react-bootstrap/Form";
import { useTranslation } from "react-i18next";



interface RadioOption {
    label: string;
    value: any;
    onClick: () => void;
  }
 
  interface CustomRadioButtonProps {
    items: RadioOption[];
   dataTestId?: string;
    ariaLabel?: string;
    id?:string;
    selectedValue?:any;
    onChange:(value: any) => void;
  }

  export const CustomRadioButton: React.FC<CustomRadioButtonProps> = ({
    items,
   dataTestId = "",
    id = "",
    ariaLabel = "",
    selectedValue = "",
    onChange = () => {}
  }) => {
    const { t } = useTranslation();
    return (
      <Form className="custom-radio-button" aria-label={ariaLabel}>
        {items.map((option, index) => (
          <Form.Check
            inline
            label={t(option.label)}
            value={option.value}
            name="group1"
            type="radio"
            id={`${id}-${index + 1}`}
            data-testid={`${dataTestId}-inline-radio-${index + 1}`}
            key={option.value || option.label}
            checked={selectedValue === option.value} // use `checked` for controlled component
            onChange={() => onChange(option.value)} // Call with option value
          />
        ))}
      </Form>
    );
  };
