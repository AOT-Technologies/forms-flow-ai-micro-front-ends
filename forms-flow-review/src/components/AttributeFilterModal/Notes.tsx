import { CustomInfo } from "@formsflow/components";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../reducers";
 
const RenderOwnerShipNotes = ({isCreator, attributeFilter}) => {
  const { t } = useTranslation();
  const isUnsavedFilter = useSelector((state:RootState)=>state.task.isUnsavedFilter);

  if(attributeFilter){
    if (isCreator ) {
    return (
      <div className="pb-4">
        <CustomInfo
          className="note"
          heading="Note"
          content={t("This filter is created and managed by you")}
          dataTestId="attribute-self-share-note"
        />
      </div>
    );
  }
  }
  

  if (isUnsavedFilter) {
    return (
      <div className="pb-4">
        <CustomInfo
          className="note"
          heading="Note"
          content={t(
            "You may only save Fields filters if you are using a saved Tasks filter first. Please save your current Tasks filter first."
          )}
          dataTestId="save-task-filter-first-note"
        />
      </div>
    );
  }

  
if(attributeFilter?.id){
if (!isCreator) {
    return (
      <div className="pb-4">
        <CustomInfo
        className="note"
        heading="Note"
        content={t("This filter is created and managed by {{createdBy}}", {
          createdBy: attributeFilter?.createdBy,
        })}
        dataTestId="attribute-filter-save-note"
      />
      </div>
    );
  }
}
  
  return null;
};

export default RenderOwnerShipNotes;
