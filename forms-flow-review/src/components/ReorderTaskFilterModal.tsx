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
import { saveFilterPreference } from "../api/services/filterServices";
import { useSelector } from "react-redux";
import { RootState } from "../reducers/index.js";

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
            isChecked: item.hide,
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
      const handleSaveChanges = () => {
        // here need to call the saveFilterPreference api to save the updated filterList before
        //   payload only contains the id and sortOrder ,hide: the isChecked
        const updatedFiltersPreference = sortedFilterList.map((item) => ({
          filterId: item.id,
          hide: item.isChecked,
          sortOrder: item.sortOrder,
        }));
        saveFilterPreference(updatedFiltersPreference);
        setShowReorderFilterModal(false);
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
