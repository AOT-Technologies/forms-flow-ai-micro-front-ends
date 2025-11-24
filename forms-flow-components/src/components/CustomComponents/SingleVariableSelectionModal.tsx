import React, { useEffect, useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { StyleServices } from "@formsflow/service";

import { CloseIcon } from "../SvgIcons";
import { V8CustomButton } from "./CustomButton";
import {
  VariableSelection,
  type FormVariable,
  type SystemVariable,
} from "./VariableSelection";

type VariableCategory = "fields" | "form" | "system";

export interface VariableOption {
  id: string;
  label: string;
  description?: string;
  key: string;
  source: VariableCategory;
  raw: FormVariable | SystemVariable;
}

export interface SingleVariableSelectionModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  formVariables?: FormVariable[];
  systemVariables?: SystemVariable[];
  primaryButtonText: string;
  primaryButtonAction: (selectedVariable: VariableOption) => void;
  secondaryButtonText?: string;
  form: any;
  secondaryButtonAction?: () => void;
  onCategoryChange?: (category: VariableCategory) => void;
}

export const SingleVariableSelectionModal: React.FC<
  SingleVariableSelectionModalProps
> = ({
  show,
  onClose,
  title,
  formVariables = [],
  systemVariables = [],
  primaryButtonText,
  primaryButtonAction,
  secondaryButtonText,
  secondaryButtonAction,
  form,
  onCategoryChange,
}) => {
  const { t } = useTranslation();
  const darkColor = StyleServices.getCSSVariable("--secondary-dark");

  const [activeCategory, setActiveCategory] =
    useState<VariableCategory>("fields");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formVariablesState, setFormVariablesState] = useState<FormVariable[]>(
    formVariables || []
  );

  useEffect(() => {
    setFormVariablesState(formVariables || []);
  }, [formVariables]);

  const formVariableOptions = useMemo<VariableOption[]>(() => {
    if (!formVariablesState) return [];
    return formVariablesState.map((variable) => ({
      id: `form-${variable.key}`,
      label: variable.labelOfComponent || variable.key,
      description: `${variable.type} • ${variable.key}`,
      key: variable.key,
      source: "form",
      raw: variable,
    }));
  }, [formVariablesState]);

  const systemVariableOptions = useMemo<VariableOption[]>(() => {
    if (!systemVariables) return [];
    return systemVariables.map((variable) => ({
      id: `system-${variable.key}`,
      label: variable.labelOfComponent || variable.key,
      description: `${variable.type} • ${variable.key}`,
      key: variable.key,
      source: "system",
      raw: variable,
    }));
  }, [systemVariables]);

  const combinedVariables = useMemo<VariableOption[]>(
    () => [...formVariableOptions, ...systemVariableOptions],
    [formVariableOptions, systemVariableOptions]
  );

  const variablesByCategory = useMemo<VariableOption[]>(() => {
    if (activeCategory === "fields") {
      return combinedVariables;
    }
    return [];
  }, [activeCategory, combinedVariables]);

  useEffect(() => {
    if (!show) {
      setSelectedId(null);
      setActiveCategory("fields");
    }
  }, [show]);

  const selectedVariable = useMemo<VariableOption | undefined>(() => {
    return combinedVariables.find((variable) => variable.id === selectedId);
  }, [combinedVariables, selectedId]);

  const handlePrimaryAction = () => {
    if (selectedVariable) {
      primaryButtonAction(selectedVariable);
    }
  };

  const handleSelection = (variableId: string) => {
    setSelectedId(variableId);
  };

  const handleSecondaryAction = () => {
    if (secondaryButtonAction) {
      secondaryButtonAction();
    } else {
      onClose();
    }
  };

  const handleCategoryChange = (category: VariableCategory) => {
    setActiveCategory(category);
    onCategoryChange?.(category);
  };

  const renderFieldsList = () => {
    if (!variablesByCategory.length) {
      return (
        <div className="reusable-standard-modal-content-wrapper">
          <div className="reusable-standard-modal-question">
            {t("No variables available for this category.")}
          </div>
        </div>
      );
    }

    return (
      <div className="single-variable-list" role="radiogroup">
        {variablesByCategory.map((variable) => {
          const isSelected = selectedId === variable.id;
          return (
            <label
              key={variable.id}
              className={`single-variable-option ${isSelected ? "selected" : ""}`}
              aria-checked={isSelected}
            >
              <input
                type="radio"
                className="single-variable-option-radio"
                checked={isSelected}
                onChange={() => handleSelection(variable.id)}
                aria-label={variable.label}
              />
              <div className="single-variable-option-content">
                <span className="single-variable-option-label">{variable.label}</span>
              </div>
            </label>
          );
        })}
      </div>
    );
  };

  const renderBodyContent = () => {
    if (activeCategory === "fields") {
      return renderFieldsList();
    }

    if (!form) {
      return (
        <div className="reusable-standard-modal-content-wrapper">
          <div className="reusable-standard-modal-question">
            {t("This section will be available soon.")}
          </div>
        </div>
      );
    }

      return (
        <div className="mx-2">
          <VariableSelection
            tabKey={activeCategory}
            SystemVariables={(systemVariables || []) as any}
            savedFormVariables={formVariablesState}
            form={form}
            show={show}
            onClose={onClose}
            onChange={(alternativeLabels) => {
              const updatedVariables = Object.values(alternativeLabels || {});
              setFormVariablesState(updatedVariables);
            }}
            disabled={false}
          />
        </div>
      );
  };

  const filterButtons = [
    { key: "fields" as VariableCategory, label: t("Fields") },
    { key: "form" as VariableCategory, label: t("Form") },
    { key: "system" as VariableCategory, label: t("System") },
  ];

  return (
    <Modal
      show={show}
      onHide={onClose}
      dialogClassName="reusable-standard-modal"
      aria-labelledby="single-variable-selection-modal-title"
    >
      <Modal.Header>
        <div className="modal-header-content">
          <Modal.Title id="single-variable-selection-modal-title">
            {t(title)}
            <div onClick={onClose}>
              <CloseIcon color={darkColor} />
            </div>
          </Modal.Title>
     

     <div className="modal-subtitle d-flex gap-2">
          {filterButtons.map((button) => (
            <V8CustomButton
              key={button.key}
              type="button"
              className={`reusable-standard-modal-filter-btn ${
                activeCategory === button.key ? "active" : ""
              }`}
              label={button.label}
              onClick={() => handleCategoryChange(button.key)}
            />
          ))}
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="custom-scroll">{renderBodyContent()}</Modal.Body>

      {(primaryButtonText || secondaryButtonText) && (
        <Modal.Footer>
          {secondaryButtonText && (
            <V8CustomButton
              label={t(secondaryButtonText)}
              onClick={handleSecondaryAction}
              variant="secondary"
            />
          )}
          {primaryButtonText && (
            <V8CustomButton
              label={t(primaryButtonText)}
              onClick={handlePrimaryAction}
              variant="primary"
              disabled={!selectedVariable}
            />
          )}
        </Modal.Footer>
      )}
    </Modal>
  );
};



