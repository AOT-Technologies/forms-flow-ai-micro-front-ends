import React, { useEffect, useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { UserDetail } from "../types/taskFilter.js";
import {
  CloseIcon,
  V8CustomButton,
  DragandDropSort,
  SharedWithMeIcon,
  SharedWithOthersIcon,
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import {
  fetchAttributeFilterList,
  saveFilterPreference,
} from "../api/services/filterServices";
import { useSelector, useDispatch } from "react-redux";
import {
  setAttributeFilterList,
  setSelectedBpmAttributeFilter,
} from "../actions/taskActions";
import { RootState } from "../reducers/index.js";
import { StyleServices } from "@formsflow/service";

interface ReorderAttributeFilterModalProps {
  showAttributeModal?: boolean;
  onClose?: () => void;
  attributeFilterList?: any[];
  setShowReorderAttributeFilterModal: (value: boolean) => void;
}

export const ReorderAttributeFilterModal: React.FC<ReorderAttributeFilterModalProps> =
  React.memo(
    ({
      showAttributeModal,
      onClose,
      attributeFilterList,
      setShowReorderAttributeFilterModal,
    }) => {
      const { t } = useTranslation();
      const dispatch = useDispatch();
      const darkColor = StyleServices.getCSSVariable("--secondary-dark");
      const userDetails: UserDetail = useSelector(
        (state: RootState) => state.task.userDetails
      );
      const selectedFilter = useSelector(
        (state: any) => state.task.selectedFilter
      );

      const selectedAttributeFilter = useSelector(
        (state: any) => state.task.selectedAttributeFilter
      );
      const [sortedAttributeFilterList, setSortedAttributeFilterList] =
        useState<any[]>([attributeFilterList]);

      //  need to  update the filterList with only key of Id,name,isChcked ,sortOrder,Icon in order to pass to drag and drop
      const updateAttributeFilterList = useMemo(() => {
        return (
          attributeFilterList?.map((item) => {
            const createdByMe =
              userDetails?.preferred_username === item?.createdBy;
            const isSharedToPublic =
              !item?.roles?.length && !item?.users?.length;
            const isSharedToRoles = item?.roles?.length;
            const isSharedToMe = item?.roles?.some((role) =>
              userDetails?.groups?.includes(role)
            );

            // let icon = null;
            // if (
            //   selectedFilter?.users?.length > 0 &&
            //   !item?.roles?.length &&
            //   !item?.users?.length
            // ) {
            //   icon = null;
            // } else if (createdByMe && (isSharedToPublic || isSharedToRoles)) {
            //   icon = <SharedWithOthersIcon />;
            // } else if (isSharedToPublic || isSharedToMe) {
            //   icon = <SharedWithMeIcon />;
            // }
            return {
              id: item.id,
              name: item.name,
              isChecked: !item.hide,
              sortOrder: item.sortOrder,
              // icon: icon,
            };
          }) || []
        );
      }, [attributeFilterList]);

      // set the updated filterList to  sortedfilterLis state ,to compare the updated filterList with the original filterList initially
      useEffect(() => {
        setSortedAttributeFilterList(updateAttributeFilterList);
      }, [updateAttributeFilterList]);

      //callback function to update the filterList after drag and drop
      const onUpdateFilterOrder = (dragedFilterList) => {
        setSortedAttributeFilterList(dragedFilterList);
      };

      const handleDiscardChanges = () => {
        onClose();
      };
      const handleSaveChanges = async () => {
        const updatedFiltersPreference = sortedAttributeFilterList.map(
          ({ id, isChecked, sortOrder }) => ({
            filterId: id,
            hide: !isChecked,
            sortOrder,
          })
        );

        const selectedFilterHide = selectedAttributeFilter
          ? sortedAttributeFilterList.some(
              ({ id, isChecked }) =>
                id === selectedAttributeFilter.id && !isChecked
            )
          : false;

        try {
          // Save preferences
         await saveFilterPreference(updatedFiltersPreference, "ATTRIBUTE", selectedFilter?.id);
          // Fetch new filters list
          const actionResult = await dispatch(
            fetchAttributeFilterList(selectedFilter?.id) as any
          );

          const response = actionResult?.payload ?? {}; // fallback if unwrap isn't available
          const filters = response?.filters ?? [];

          // If selected filter is hidden, pick the first visible filter
          const updatedfilters = filters.filter((filter) => !filter.hide);
          if (selectedFilterHide) {
            dispatch(setSelectedBpmAttributeFilter(updatedfilters[0]));
          }

          // Update store
          dispatch(setAttributeFilterList(filters));

          // Close modal
          setShowReorderAttributeFilterModal(false);
        } catch (error) {
          console.error("Failed to save filter preferences:", error);
        }
      };

      const isSaveBtnDisabled = useMemo(() => {
        const original = JSON.stringify(
          updateAttributeFilterList.map(({ id, isChecked, sortOrder }) => ({
            id,
            isChecked,
            sortOrder,
          }))
        );
        const current = JSON.stringify(
          sortedAttributeFilterList.map(({ id, isChecked, sortOrder }) => ({
            id,
            isChecked,
            sortOrder,
          }))
        );
        return original === current;
      }, [sortedAttributeFilterList, updateAttributeFilterList]);

      return (
        <Modal
          show={showAttributeModal}
          centered
          size="lg"
          dialogClassName="drag-drop-container"
        >
          <Modal.Header>
            <div className="modal-header-content">
              <Modal.Title>
                {" "}
                {t("Re-order And Hide Filters")}
                <div onClick={onClose}>
                  <CloseIcon color={darkColor} />
                </div>
              </Modal.Title>
              <div className="modal-subtitle">
                Toggle the visibility of filters and order them
              </div>
            </div>
          </Modal.Header>
          <Modal.Body>
            <DragandDropSort
              items={updateAttributeFilterList}
              onUpdate={onUpdateFilterOrder}
              preventLastCheck={true}
            />
          </Modal.Body>
          <Modal.Footer>
              <V8CustomButton
                label={t("Discard changes")}
                onClick={handleDiscardChanges}
                dataTestId="discard-changes"
                ariaLabel={t("Discard changes")}
                variant="secondary"
                disabled={isSaveBtnDisabled}
              />
              <V8CustomButton
                label={t("Save and apply")}
                dataTestId="save-and-apply"
                ariaLabel={t("Save and apply")}
                onClick={handleSaveChanges}
                disabled={isSaveBtnDisabled}
                variant="primary"
              />
          </Modal.Footer>
        </Modal>
      );
    }
  );
