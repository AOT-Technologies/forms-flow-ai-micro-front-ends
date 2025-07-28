import React, { useCallback, useEffect, useRef, useState } from "react";
import { Form, Utils } from "@aot-technologies/formio-react";
import _ from "lodash";

interface SelectedComponent {
  key: string | null;
  type: string;
  label: string;
  altVariable: string;
}
interface FormComponentProps {
  form: any;
  alternativeLabels: any;
  setSelectedComponent: (value: SelectedComponent) => void;
  setShowElement: (value: boolean) => void;
  detailsRef: React.RefObject<HTMLInputElement> ;
  ignoreKeywords: Set<string>;
}


export const FormComponent: React.FC<FormComponentProps> = React.memo(
  ({
    form,
    alternativeLabels,
    setSelectedComponent,
    setShowElement,
    detailsRef,
    ignoreKeywords
  }) => {


    const formRef = useRef(null);
    
     
    /* ------------- manipulate the hidden variable to show in form ------------- */
    const [updatedForm, setUpdatedForm] = useState(null);
    const [manipulatedKeys, setManipulatedKeys] = useState(new Set());
    const [nestedDataKeys, setNestedDataKeys] = useState({});

    function getParentKeys(parentComponent) {
      if (!parentComponent) return [];

      const parentElement = parentComponent.getAttribute("ref");

      if (parentElement === "webform") return [];

      const nestedContainer = parentElement?.slice(7);

      if (parentElement === "component") {
        return getParentKeys(parentComponent.parentElement);
      }

      return nestedDataKeys[nestedContainer]
        ? [...getParentKeys(parentComponent.parentElement), nestedContainer]
        : getParentKeys(parentComponent.parentElement);
    }
    // Filter out applicationId and applicationStatus
    
    // initially we had a problem with the hidden variable not showing in the form so we have to manipulate the hidden variable to show in form
    useEffect(() => {
      const data = _.cloneDeep(form);
      const manipulatedKeys = [];
      Utils.eachComponent(
        data.components,
        (component) => {
          // remove display (show/hide) conditions for showing the component in taskvariable modal
          /* --------------------------- ------------------ --------------------------- */
          component.conditional = {};
          component.customConditional = "";
          component.logic = [];
          component.hidden = false;
          component.hideLabel = false;

          if (component.type == "container" || component.type == "survey") {
            setNestedDataKeys((prev) => ({
              ...prev,
              [component.key]: component.type,
            }));
          }
          /* ---------------------------------- ---- ---------------------------------- */
          //Keys ignored for the default task variable that don't need to be displayed in the form.
          if (
            component.type == "hidden" &&
            !ignoreKeywords.has(component.key)
          ) {
            component.type = "textfield";
            manipulatedKeys.push(component.key);
            component.customClass = "taskvariable-hiddent-component";
          }
        },
        true
      );
      setUpdatedForm(data);
      setManipulatedKeys(new Set(manipulatedKeys));
    }, [form, ignoreKeywords]);

    //   These ignored keys and types from rendering the form.
    const ignoredTypes = new Set([
      "button",
      "columns",
      "panel",
      "well",
      "container",
      "htmlelement",
      "tabs",
    ]);
    const ignoredKeys = new Set(["hidden"]);

    //   This function is used to get the  keys and types  of the component.
    const handleClick = useCallback(
      (e) => {
        const formioComponent = e.target.closest(".formio-component");
        const highlightedElement = document.querySelector(".formio-hilighted");

        if (highlightedElement) {
          highlightedElement.classList.remove("formio-hilighted");
        }
        const parentComponent = formioComponent?.parentElement;
        const parentKeys = getParentKeys(parentComponent);

        if (formioComponent) {
          let classes = Array.from(formioComponent.classList).filter(
            (cls: string) => cls.startsWith("formio-component-")
          );
          const keyClass = classes[classes.length - 1];
          const typeClass = classes[classes.length - 2];
          //if key and type are same , then there will be only one class for both
          
          const componentKey =(keyClass as string)?.split("-").pop();
          const componentType = typeClass
            ? (typeClass as string).split("-").pop()
            :componentKey;

          // Check if the component type is in the ignored list
          // Check if the component key is in the ignored list

          if (
            ignoredTypes.has(componentType) ||
            ignoredKeys.has(componentKey)
          ) {
            setShowElement(false);
            setSelectedComponent({
              key: null,
              type: "",
              label: "",
              altVariable: "",
            });
            return;
          }

          const labelElement = formioComponent.querySelector("label");
          let label = "";

          if (labelElement) {
            label = Array.from(labelElement.childNodes)
              .filter((node: ChildNode) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const el = node as HTMLElement;
                  return !el.classList.contains("sr-only");
                }
                return true;
              })
              .map((node: ChildNode) => node.textContent?.trim() || "")
              .join(" ");
          }

          // Highlight the selected component
          formioComponent.classList.add("formio-hilighted");
          setShowElement(true);

          // Update the selected component state
          setSelectedComponent({
            key: parentKeys.length
              ? [...parentKeys, componentKey].join(".")
              : componentKey,
            type: manipulatedKeys.has(componentKey) ? "hidden" : componentType,
            label,
            altVariable: alternativeLabels[componentKey]?.altVariable ?? "",
          });
        } else {
          setSelectedComponent({
            key: null,
            type: "",
            label: "",
            altVariable: "",
          });
        }
      },
      [alternativeLabels, manipulatedKeys]
    );

        // hide details when clicking outside form component and removinf the formio-highlighted class
    useEffect(() => {
      const formHilighter = document.querySelector(".form-hilighter");

      const handleOutsideClick = (event) => {
        const clickedInsideForm = formHilighter?.contains(event.target);
        const clickedInsideDetails = detailsRef.current?.contains(event.target);

        if (!clickedInsideForm && !clickedInsideDetails) {
          setShowElement(false);
          const highlightedElement = document.querySelector(".formio-hilighted");
          if (highlightedElement) {
            highlightedElement.classList.remove("formio-hilighted"); // Remove the highlight class
          }
        }
      };
      formHilighter?.addEventListener("click", handleClick);
      document.addEventListener("mousedown", handleOutsideClick);

      return () => {
        formHilighter?.removeEventListener("click", handleClick);
        document.removeEventListener("mousedown", handleOutsideClick);
      };
    }, [handleClick]);


    
    return (
      <div className="flex">
        <div className="flex-grow-1 form-container form-hilighter">
        <Form
          form={updatedForm}
          options={{
            viewAsHtml: true,
            readOnly: true,
          }}
          formReady={(e) => {
            formRef.current = e;
          }}
        />
      </div>
      </div>
    );
  }
);
