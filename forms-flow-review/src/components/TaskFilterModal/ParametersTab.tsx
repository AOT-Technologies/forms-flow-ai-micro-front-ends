import { useTranslation } from "react-i18next";
import { FormSelectionModal } from "../FormSelectionModal";
const ParametersTab = ({
  selectedForm,
  toggleFormSelectionModal,
  handleFormSelection,
  forms,
}) => {
  const computedStyle = getComputedStyle(document.documentElement);
  const { t } = useTranslation();

  return (
         <FormSelectionModal
        forms={forms}
        showModal={true}
        onClose={toggleFormSelectionModal}
        onSelectForm={handleFormSelection}
        selectedForm={selectedForm}
      />
  );
};

export default ParametersTab;
