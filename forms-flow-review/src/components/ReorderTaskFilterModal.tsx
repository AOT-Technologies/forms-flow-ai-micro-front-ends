import React, { useEffect, useState,useMemo } from 'react';
import Modal from "react-bootstrap/Modal";
import { CloseIcon, CustomButton, CustomInfo, DragandDropSort, SharedWithOthersIcon, SharedWithMeIcon } from "@formsflow/components";
import { useTranslation } from "react-i18next";
import { StorageService } from "@formsflow/service";
import { UserDetail } from "../types/taskFilter.js";
import {
  saveFilterPreference
} from "../api/services/filterServices";
import { useDispatch,useSelector } from "react-redux";
import { setFilterPreference } from "../actions/taskActions";
interface ReorderTaskFilterModalProps {
  showModal?: boolean;
  onClose?: () => void;
  filtersList?: any[];
}


export const ReorderTaskFilterModal: React.FC<ReorderTaskFilterModalProps> = React.memo(
  ({ showModal, onClose, filtersList }) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const taskFilterPreference = useSelector((state: any) => state.task.taskFilterPreference);
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [updateFilterList, setUpdateFilterList] = useState<any[]>([]);
    const [filterPreferenceList, setFilterPreferenceList] = useState<any[]>(taskFilterPreference);
    useEffect(() => {
      const user = StorageService.getParsedData(StorageService.User.USER_DETAILS);
      if (user) setUserDetail(user);
    }, []);

    
    const updatedFilters = useMemo(() => {
      if (!filtersList || !userDetail) return [];
      return filtersList.map((item) => {
        const createdByMe = userDetail.preferred_username === item.createdBy;
        const isSharedToPublic = (!item.roles?.length && !item.users?.length);
        const isShareToMe = item.roles?.some(role => userDetail.groups?.includes(role));
        const icon = createdByMe ? <SharedWithOthersIcon /> : (isSharedToPublic || isShareToMe ? <SharedWithMeIcon /> : null);
        const preference = taskFilterPreference?.find(pref => pref.filterId === item.id);
    
        return {
          id: item.id,
          name: item.name,
          isChecked: preference ? preference.hide : item.hide,
          sortOrder: preference ? preference.sortOrder : item.sortOrder,
          icon,
        };
      }).sort((a, b) => a.sortOrder - b.sortOrder);
    }, [filtersList, userDetail, taskFilterPreference]);

    useEffect(() => {
      setUpdateFilterList(updatedFilters);
      setFilterPreferenceList(updatedFilters);
    }, [updatedFilters,showModal]);
    
    const onUpdateFilterOrder = (sortedFilterList) => {
      setFilterPreferenceList(sortedFilterList);
    };
    const handleDiscardChanges = () => {
      setFilterPreferenceList([]); // reset local state
      setUpdateFilterList([]);
      onClose();
    };
    const handleSaveChanges = () => {
      if (filterPreferenceList && filterPreferenceList.length > 0) {

        const updatedFiltersPreference = filterPreferenceList.map((item) => ({
          filterId: item.id,
          hide: item.isChecked,
          sortOrder: item.sortOrder,
        }));
        saveFilterPreference(updatedFiltersPreference)
        .then(() => dispatch(setFilterPreference(updatedFiltersPreference)))
        .catch((error) => console.error('Failed to save preferences', error));

      }
      onClose();
    }; 
   
     const isSaveBtnDisabled = useMemo(() => {
       if (!filterPreferenceList || !updateFilterList) return true;

       return !filterPreferenceList.some((updatedItem) => {
         const originalItem = updateFilterList.find(
           (item) => item.id === updatedItem.id
         );
         if (!originalItem) return true;
         return (
           originalItem.isChecked !== updatedItem.isChecked ||
           originalItem.sortOrder !== updatedItem.sortOrder
         );
       });
     }, [filterPreferenceList, updateFilterList]);

    
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
            onUpdate={onUpdateFilterOrder} />
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