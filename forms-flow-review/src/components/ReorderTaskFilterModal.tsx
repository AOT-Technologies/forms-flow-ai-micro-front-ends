import React, { useEffect, useMemo, useState } from "react";
import { AppModal } from "@formsflow/components";
import { UserDetail } from "../types/taskFilter.js";
import {
  CloseIcon,
  DragandDropSort,
  V8CustomButton

} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import { fetchBPMTaskCount,fetchFilterList, saveFilterPreference, updateDefaultFilter } from "../api/services/filterServices";
import { useSelector,useDispatch } from "react-redux";
import { RootState } from "../reducers/index.js";
import { setBPMFilterList, setDefaultFilter, setSelectedFilter } from "../actions/taskActions";
import { StyleServices } from "@formsflow/service";


interface ReorderTaskFilterModalProps {
  showModal?: boolean;
  onClose?: () => void;
  filtersList?: any[];
  setShowReorderFilterModal: (value: boolean) => void;
}

export const ReorderTaskFilterModal: React.FC<ReorderTaskFilterModalProps> =
  React.memo(
    ({ showModal, onClose, filtersList, setShowReorderFilterModal }) => {
      const userDetails: UserDetail = useSelector(
        (state: RootState) => state.task.userDetails
      );
      const { t } = useTranslation();
      const dispatch = useDispatch();
      const selectedFilter = useSelector((state: any) => state.task.selectedFilter);

      const [myFilterList, setMyFilterList] = useState<any[]>([]);
      const [sharedFilterList, setSharedFilterList] = useState<any[]>([]);

      const darkColor = StyleServices.getCSSVariable("--secondary-dark");
      //  need to  update the filterList with only key of Id,name,isChcked ,sortOrder,Icon in order to pass to drag and drop
      const updateFilterList = useMemo(() => {
        return filtersList.map((item) => {
          const createdByMe = userDetails?.preferred_username === item?.createdBy;
          const isSharedToPublic = !item?.roles?.length && !item?.users?.length;
          const isSharedToRoles = item?.roles?.length;
          const isSharedToMe = item?.roles?.some((role) =>
            userDetails?.groups?.includes(role)
          );

          let category = "my";
          if (createdByMe && (isSharedToPublic || isSharedToRoles)) {
            category = "my";
          } else if (isSharedToPublic || isSharedToMe) {
            category = "shared";
          }

          return {
            id: item.id,
            name: item.name,
            isChecked: !item.hide,
            sortOrder: item.sortOrder,
            category,
          };
        });
      }, [filtersList, userDetails]);

      // set the updated filterList to  sortedfilterLis state ,to compare the updated filterList with the original filterList initially
      useEffect(() => {
        const myFilters = updateFilterList.filter(f => f.category === "my");
        const sharedFilters = updateFilterList.filter(f => f.category === "shared");
        setMyFilterList(myFilters);
        setSharedFilterList(sharedFilters);
      }, [updateFilterList]);

      const onUpdateMyFilters = (updatedList) => {
        setMyFilterList(updatedList);
      };

      const onUpdateSharedFilters = (updatedList) => {
        setSharedFilterList(updatedList);
      };

      const handleDiscardChanges = () => {
        onClose();
      };
      const handleSaveChanges = async () => {
        // Combine lists for saving
        const combinedList = [...myFilterList, ...sharedFilterList];

        const updatedFiltersPreference = combinedList.map(
          ({ id, isChecked }, index) => ({
            filterId: id,
            hide: !isChecked,
            sortOrder: index, // Update sort order based on new position
          })
        );

        const selectedFilterHide = combinedList.some(
          ({ id, isChecked }) => id === selectedFilter.id && !isChecked
        );

        try {
          await saveFilterPreference(updatedFiltersPreference);

          const { data: { filters } } = await fetchFilterList();
           //create an array of filters with no hidden filters
          const updatedfilters = filters.filter((filter) => !filter.hide);
          //If the selected filter is unchecked(hide) ,then set the first sorted filter with hide false as the selected filter
          if(selectedFilterHide){
          dispatch(setSelectedFilter(updatedfilters[0]));
          dispatch(setDefaultFilter(updatedfilters[0].id));
          updateDefaultFilter(updatedfilters[0].id); 
          }        
          dispatch(fetchBPMTaskCount(updatedfilters));
          dispatch(setBPMFilterList(filters));
          setShowReorderFilterModal(false);
        } catch (error) {
          console.error("Failed to save filter preferences:", error);
        }
      };

      const isSaveBtnDisabled = useMemo(() => {
        const myFiltersChecked = myFilterList.some(f => f.isChecked);
        const sharedFiltersChecked = sharedFilterList.some(f => f.isChecked);

        if (!myFiltersChecked && !sharedFiltersChecked) {
          return true;
        }

        const originalMy = updateFilterList.filter(f => f.category === "my");
        const originalShared = updateFilterList.filter(f => f.category === "shared");

        const formatForCompare = (list) => list.map(({ id, isChecked }) => ({ id, isChecked }));

        const myChanged = JSON.stringify(formatForCompare(originalMy)) !== JSON.stringify(formatForCompare(myFilterList));
        const sharedChanged = JSON.stringify(formatForCompare(originalShared)) !== JSON.stringify(formatForCompare(sharedFilterList));

        return !myChanged && !sharedChanged;
      }, [myFilterList, sharedFilterList, updateFilterList]);

      return (
        <AppModal
          show={showModal}
          centered
          size="lg"
          dialogClassName="drag-drop-container"
        >
          <AppModal.Header>
           <div className="modal-header-content">
           <AppModal.Title> {t("Re-order And Hide Filters")}
            <div onClick={onClose} >
              <CloseIcon color={darkColor}/>
            </div>
               </AppModal.Title>
            
            <div className="modal-subtitle">
            Toggle the visibility of filters and order them 
            </div>
           </div>
          </AppModal.Header>
          <AppModal.Body>
            <div className="filter-section mb-3">
              <DragandDropSort
                items={myFilterList}
                onUpdate={onUpdateMyFilters}
                preventLastCheck={true}
                heading={t("Personal Filters")}
                subHeading={t("Only you can see these")}
              />
            </div>
            <div className="filter-section">
              <DragandDropSort
                items={sharedFilterList}
                onUpdate={onUpdateSharedFilters}
                preventLastCheck={false}
                heading={t("Shared Filters")}
                subHeading={t("Both you and others can see these")}
              />
            </div>
          </AppModal.Body>
          <AppModal.Footer>
              <V8CustomButton
                label={t("Discard changes")}
                variant="secondary"
                  dataTestId="discard-changes"
                  ariaLabel={t("Discard Changes")}
                onClick={handleDiscardChanges}
                disabled={isSaveBtnDisabled}
              />
              <V8CustomButton
                label={t("Save and apply")}
                onClick={handleSaveChanges}
                dataTestId="save-and-apply"
                ariaLabel={t("Save and apply")}
                variant="primary"
                disabled={isSaveBtnDisabled}
              />

          </AppModal.Footer>
        </AppModal>
      );
    }
  );


