import Modal from "react-bootstrap/Modal";
import { CloseIcon, CustomButton } from "@formsflow/components"; 
import { useTranslation } from "react-i18next";
import TaskFilterModalBody from "./TaskFilterModalBody";
import { useRef } from "react";
const TaskFilterModal = ({ show, onClose, canEdit, filter, toggleFilterModal}) => {
  const { t } = useTranslation();
  const modalBodyRef = useRef(null);
 
  const handleFilterResults = () => {
    modalBodyRef.current.filterResults();
    onClose();
  };
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
              filter
                ? filter.name //need to check if it is unsaved or not
                : "Unsaved Filter"
            }`}</b>
          </Modal.Title>
          <div className="d-flex align-items-center cursor-pointer">
            <CloseIcon onClick={onClose} />
          </div>
        </Modal.Header>

        <Modal.Body className="modal-body p-0">
          <TaskFilterModalBody
          toggleFilterModal={toggleFilterModal}
            ref={modalBodyRef}
            canEdit={canEdit}
            showTaskFilterMainModal={show}
            onClose={onClose}
            filter={filter}
          />
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-start">
          <CustomButton
            variant="primary"
            size="md"
            label={t("Filter Results")}
            dataTestId="task-filter-results"
            ariaLabel={t("Filter results")}
            onClick={handleFilterResults}
            disabled={modalBodyRef?.current?.disableFilterButton}
          />
          <CustomButton
            variant="secondary"
            size="md"
            label={t("Cancel")}
            onClick={onClose}
            dataTestId="cancel-task-filter"
            ariaLabel={t("Cancel filter")}
          />
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TaskFilterModal;
