import React, { useEffect, useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { UserDetail } from "../types/taskFilter.js";
import {
  CloseIcon,
  CustomButton,
  CustomInfo,
  DragandDropSort,
  SharedWithMeIcon,
  SharedWithOthersIcon,
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import { fetchBPMTaskCount,fetchFilterList, saveFilterPreference, updateDefaultFilter } from "../api/services/filterServices";
import { useSelector,useDispatch } from "react-redux";
import { RootState } from "../reducers/index.js";
import { setBPMFilterList, setDefaultFilter, setSelectedFilter } from "../actions/taskActions";


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
      const [sortedFilterList, setSortedFilterList] = useState<any[]>([
        filtersList,
      ]);

      //  need to  update the filterList with only key of Id,name,isChcked ,sortOrder,Icon in order to pass to drag and drop
      const updateFilterList = useMemo(() => {
        return filtersList.map((item) => {
          const createdByMe = userDetails.preferred_username === item.createdBy;
          const isSharedToPublic = !item.roles?.length && !item.users?.length;
          const isShareToMe = item.roles?.some((role) =>
            userDetails.groups?.includes(role)
          );
          let icon = null;
          if (createdByMe) {
            icon = <SharedWithOthersIcon />;
          } else if (isSharedToPublic || isShareToMe) {
            icon = <SharedWithMeIcon />;
          }
          return {
            id: item.id,
            name: item.name,
            isChecked: !item.hide,
            sortOrder: item.sortOrder,
            icon: icon,
          };
        });
      }, [filtersList]);

      // set the updated filterList to  sortedfilterLis state ,to compare the updated filterList with the original filterList initially
      useEffect(() => {
        setSortedFilterList(updateFilterList);
      }, [updateFilterList]);

      //callback function to update the filterList after drag and drop
      const onUpdateFilterOrder = (dragedFilterList) => {
        setSortedFilterList(dragedFilterList);
      };

      const handleDiscardChanges = () => {
        onClose();
      };
      const handleSaveChanges = async () => {
        // saveFilterPreference  payload only contains the id and sortOrder ,hide
        const updatedFiltersPreference = sortedFilterList.map(
          ({ id, isChecked, sortOrder }) => ({
            filterId: id,
            hide: !isChecked,
            sortOrder,
          })
        );
        // check if the selected filter is hidden or not
        const selectedFilterHide = sortedFilterList.some(
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
        const original = JSON.stringify(
          updateFilterList.map(({ id, isChecked, sortOrder }) => ({
            id,
            isChecked,
            sortOrder,
          }))
        );
        const current = JSON.stringify(
          sortedFilterList.map(({ id, isChecked, sortOrder }) => ({
            id,
            isChecked,
            sortOrder,
          }))
        );
        return original === current;
      }, [sortedFilterList, updateFilterList]);

      return (
        <Modal
          show={showModal}
          centered
          size="sm"
          className="reorder-task-filter-modal"
          backdrop="static"
        >
          <Modal.Header className="reorder-task-filter-header">
            <Modal.Title> {t("Re-order And Hide Filters")} </Modal.Title>
            <div className="d-flex align-items-center">
              <CloseIcon onClick={onClose} />
            </div>
          </Modal.Header>
          <Modal.Body className="reorder-task-filter-modal-body">
            <CustomInfo
              heading="Note"
              content="Toggle the visibility of filters and re-arrange them."
            />
            <DragandDropSort
              items={updateFilterList}
              onUpdate={onUpdateFilterOrder}
              preventLastCheck={true}
            />
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-start">
            <CustomButton
              variant="primary"
              size="md"
              label={t("Save Changes")}
              dataTestId="save-changes"
              ariaLabel={t("Save Changes")}
              onClick={handleSaveChanges}
              disabled={isSaveBtnDisabled}
            />
            <CustomButton
              variant="secondary"
              size="md"
              label={t("Discard Changes")}
              onClick={handleDiscardChanges}
              dataTestId="discard-changes"
              ariaLabel={t("Discard Changes")}
            />
          </Modal.Footer>
        </Modal>
      );
    }
  );


