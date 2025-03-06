import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormSubmissionHistoryModal } from "../components/CustomComponents/FormSubmissionHistoryModal";

const renderFormSubmissionHistoryModal = (props) => render(<FormSubmissionHistoryModal {...props} />);

const submissionHistory = [
  {
    created: "2025-01-13T05:56:02.549867Z",
    applicationStatus: "Submitted",
    id: "2562"
  },
  {
    created: "2025-01-13T05:51:24.088690Z",
    applicationStatus: "In Progress",
    id: "2559"
  }
];

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

describe("FormSubmissionHistoryModal component", () => {
  const onClose = jest.fn();
  
  const defaultProps = {
    show: true,
    onClose,
    title: "Submission History",
    allHistory: [],
    historyCount: 0
  };

  it("renders modal with no history", () => {
    renderFormSubmissionHistoryModal(defaultProps);
    expect(screen.getByText("No submission history found")).toBeInTheDocument();
  });

  it("renders modal with submission history", () => {
    renderFormSubmissionHistoryModal({
      ...defaultProps,
      allHistory: submissionHistory,
      historyCount: submissionHistory.length
    });
    
    expect(screen.getByTestId("form-history-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("form-history-content")).toBeInTheDocument();
    expect(screen.getAllByTestId(/form-history-entry-/)).toHaveLength(2);
  });

  it("closes modal when close button clicked", () => {
    renderFormSubmissionHistoryModal({
      ...defaultProps,
      allHistory: submissionHistory,
      historyCount: submissionHistory.length
    });

    const closeButton = screen.getByTestId("close-icon");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it("displays correct status and timestamp for each entry", () => {
    renderFormSubmissionHistoryModal({
      ...defaultProps,
      allHistory: submissionHistory,
      historyCount: submissionHistory.length
    });

    const historyFields = screen.getAllByTestId(/history-field-/);
    expect(historyFields[0]).toHaveTextContent("Submitted");
    expect(historyFields[2]).toHaveTextContent("In Progress");
  });

  it("handles entries with missing data", () => {
    const incompleteHistory = [
      {
        id: "1"
      }
    ];

    renderFormSubmissionHistoryModal({
      ...defaultProps,
      allHistory: incompleteHistory,
      historyCount: 1
    });

    const historyFields = screen.getAllByTestId(/history-field-/);
    expect(historyFields[0]).toHaveTextContent("N/A");
    expect(historyFields[1]).toHaveTextContent("N/A");
  });
});
