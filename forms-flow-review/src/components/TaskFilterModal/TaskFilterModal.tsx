import Modal from "react-bootstrap/Modal";
import { CloseIcon, CustomButton } from "@formsflow/components"; 
import { useTranslation } from "react-i18next";
import TaskFilterModalBody from "./TaskFilterModalBody";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
const TaskFilterModal = ({ show, onClose, canEdit, filter, toggleFilterModal}) => {
  const { t } = useTranslation(); 
  const isUnsavedFilter = useSelector((state:any) => state.task.isUnsavedFilter);
 
  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        size="sm"
        centered
        data-testid="create-filter-modal"
        aria-labelledby={t("create filter modal title")}
        aria-describedby="create-filter-modal"
        backdrop="static"
        className="create-filter-modal"
      >
        <Modal.Header>
          <Modal.Title id="create-filter-title">
            <b>{`${t("Tasks")}: ${
              (filter && !isUnsavedFilter) ? filter.name //need to check if it is unsaved or not
                : "Unsaved Filter"
            }`}</b>
          </Modal.Title>
          <div className="d-flex align-items-center cursor-pointer">
            <CloseIcon onClick={onClose} />
          </div>
        </Modal.Header>
       
          <TaskFilterModalBody
            toggleFilterModal={toggleFilterModal} 
            canEdit={canEdit}
            showTaskFilterMainModal={show}
            closeTaskFilterMainModal={onClose}
            filter={filter}
          />
 
      
      </Modal>
    </>
  );
};

export default TaskFilterModal;
