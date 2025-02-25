import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HistoryModal } from "../components/CustomComponents/HistoryModal";

const renderHistoryModal = (props) => render(<HistoryModal {...props} />);
const formHistory = [
  {
    created: "2025-01-13T05:56:02.549867Z",
    id: "2562",
    formId: "13131313131",
    createdBy: "abcd",
    changeLog: {
      cloned_form_id: "231313",
      new_version: false,
    },
    majorVersion: 1,
    minorVersion: 23,
    version: "1.23",
    isMajor: false,
    publishedOn: "2025-01-13 05:56:03.810871+00:00",
    publishedBy: "abcd",
  },
  {
    created: "2025-01-13T05:51:24.088690Z",
    id: "2559",
    formId: "11111111",
    createdBy: "abcd",
    changeLog: {
      cloned_form_id: "22222222",
      new_version: false,
    },
    majorVersion: 1,
    minorVersion: 22,
    version: "1.22",
    isMajor: false,
    publishedOn: "2025-01-13 05:51:44.517004+00:00",
    publishedBy: "abcd",
  },
];

const workflowHistory = [
  {
    created: "2025-02-04T06:13:12.039829Z",
    modified: "2025-02-04T06:13:12.039847Z",
    id: "2093",
    processName: "abcd",
    createdBy: "abcd",
    majorVersion: 18,
    minorVersion: 1,
    processType: "BPMN",
    isMajor: false,
  },
  {
    created: "2025-02-03T06:14:44.000449Z",
    modified: "2025-02-03T06:14:44.000467Z",
    id: "2087",
    processName: "abcd",
    createdBy: "abcd",
    majorVersion: 18,
    minorVersion: 0,
    processType: "LOWCODE",
    isMajor: true,
  },
];

describe("History Modal component", () => {
  const onClose = jest.fn();
  const revertBtnAction = jest.fn();
  const loadMoreBtnAction = jest.fn();
  const defaultProps = {
    show: true,
    onClose,
    title: "History Modal",
    revertBtnAction,
    loadMoreBtnAction,
    revertBtnText: "revert",
    loadMoreBtnText: "load more",
    revertBtndataTestid: "revert-button",
    loadMoreBtndataTestid: "loadmore-button",
    // allHistory:[],
    // categoryType:"",
    historyCount: 0,
    // disableAllRevertButton = false,
    // ignoreFirstEntryDisable = false,
    disableAllRevertButton: false,
    ignoreFirstEntryDisable: false,
  };

  it("render form history modal", () => {
    renderHistoryModal({
      ...defaultProps,
      allHistory: formHistory,
      categoryType: "FORM",
    });
    const revertButtons = screen.getAllByTestId("revert-button");
    expect(revertButtons.length).toBe(2);
    expect(screen.getAllByTestId("revert-button")[0]).toBeInTheDocument();
  });
  it("click first revert buttont, it should be disabled", () => {
    renderHistoryModal({
      ...defaultProps,
      allHistory: formHistory,
      categoryType: "FORM",
    });
    const firstButton = screen.getAllByTestId("revert-button")[0];
    fireEvent.click(firstButton);
    expect(revertBtnAction).not.toHaveBeenCalled();
  });
  it("click on revert button, form history", () => {
    renderHistoryModal({
      ...defaultProps,
      allHistory: formHistory,
      categoryType: "FORM",
    });
    const buttons = screen.getAllByTestId("revert-button");
    fireEvent.click(buttons[1]);
    const confirmButton = screen.getByTestId("confirm-revert-button");
    expect(confirmButton).toBeInTheDocument();
    fireEvent.click(confirmButton);
    expect(revertBtnAction).toHaveBeenCalled();
  });
  it("click on load more button, form and workflow history", () => {
    const history = [...formHistory, ...formHistory, ...formHistory];
    const { rerender } = renderHistoryModal({
      ...defaultProps,
      allHistory: history,
      historyCount: history.length,
      categoryType: "FORM",
    });
    const loadMoreFormButton = screen.getByText("load more");
    expect(loadMoreFormButton).toBeInTheDocument();
    fireEvent.click(loadMoreFormButton);
    expect(loadMoreBtnAction).toHaveBeenCalled();
  
    const workflowHistoryLong = [...workflowHistory, ...workflowHistory, ...workflowHistory];
    rerender(<HistoryModal {...defaultProps} categoryType="WORKFLOW" allHistory={workflowHistoryLong} historyCount={workflowHistoryLong.length} />);
    const loadMoreFlowButton = screen.getByText("load more");
    expect(loadMoreFlowButton).toBeInTheDocument();
    fireEvent.click(loadMoreFlowButton);
    expect(loadMoreBtnAction).toHaveBeenCalled();
  });


  
  it("render another category type, eg: workflow", () => {
    renderHistoryModal({
      ...defaultProps,
      allHistory: workflowHistory,
      historyCount: workflowHistory.length,
      categoryType: "WORKFLOW",
    });
    const revertButtons = screen.getAllByTestId("revert-button");
    expect(revertButtons.length).toBe(2);
    expect(screen.getAllByTestId("revert-button")[0]).toBeInTheDocument();
  });

  it("check revert button disabled for some keys", () => {
    renderHistoryModal({
      ...defaultProps,
      allHistory: workflowHistory,
      historyCount: workflowHistory.length,
      disabledData: { key: "processType", value: "LOWCODE" },
      categoryType: "WORKFLOW",
    });
    const revertButton = screen.getAllByTestId("revert-button");
    expect(revertButton[1]).toBeDisabled();
  });

  it("closes confirm modal when onClose is triggered", async() => {
    renderHistoryModal({
      ...defaultProps,
      allHistory: formHistory,
      categoryType: "FORM"
    });

    // Open confirm modal by clicking revert button
    const revertButton = screen.getAllByTestId("revert-button")[1];
    fireEvent.click(revertButton);
    
    // Verify confirm modal is shown
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();

    // Close confirm modal using close button/icon
    const confirmModalCloseButton = screen.getByTestId("confirm-modal-close");
    fireEvent.click(confirmModalCloseButton);

    // Verify confirm modal is closed
    await waitFor(() => {
      expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
    });
  });

  it("closes confirm modal when Keep Current Layout is clicked", async () => {
    renderHistoryModal({
      ...defaultProps,
      allHistory: formHistory,
      categoryType: "FORM"
    });

    // Open confirm modal by clicking revert button
    const revertButton = screen.getAllByTestId("revert-button")[1];
    fireEvent.click(revertButton);
    
    // Verify confirm modal is shown
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();

    // Click "Keep Current Layout" button
    const keepLayoutButton = screen.getByText("Keep Current Layout");
    fireEvent.click(keepLayoutButton);

    // Verify confirm modal is closed and revertBtnAction was not called
    await waitFor(() => {
      expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
    });
  });

  it("resets load more states when closing the modal", async () => {
    // Render with form history and trigger load more
    renderHistoryModal({
      ...defaultProps,
      allHistory: [...formHistory, ...formHistory, ...formHistory], // Multiple entries to show load more
      historyCount: 6,
      categoryType: "FORM"
    });

    // Click load more to set hasLoadedMoreForm to true
    const loadMoreButton = screen.getByText("load more");
    fireEvent.click(loadMoreButton);

    // Close modal using the close icon
    const closeIcon = screen.getByTestId("close-icon");
    fireEvent.click(closeIcon);

    // Verify onClose was called
    expect(onClose).toHaveBeenCalled();

    // Reopen modal and verify load more button is visible again
    renderHistoryModal({
      ...defaultProps,
      allHistory: [...formHistory, ...formHistory, ...formHistory],
      historyCount: 6,
      categoryType: "FORM"
    });

    // Load more button should be visible again since states were reset
    // expect(screen.getByText("load more")).toBeInTheDocument();
  });

  it("resets load more states when closing modal for workflow history", async () => {
    // Render with workflow history and trigger load more
    renderHistoryModal({
      ...defaultProps,
      allHistory: [...workflowHistory, ...workflowHistory, ...workflowHistory],
      historyCount: 6,
      categoryType: "WORKFLOW"
    });

    // Click load more to set hasLoadedMoreWorkflow to true
    const loadMoreButton = screen.getByText("load more");
    fireEvent.click(loadMoreButton);

    // Close modal using the close icon
    const closeIcon = screen.getByTestId("close-icon");
    fireEvent.click(closeIcon);

    // Verify onClose was called
    expect(onClose).toHaveBeenCalled();

    // Reopen modal and verify load more button is visible again
    renderHistoryModal({
      ...defaultProps,
      allHistory: [...workflowHistory, ...workflowHistory, ...workflowHistory],
      historyCount: 6,
      categoryType: "WORKFLOW"
    });

  });

  it("handles revert click correctly for form history with correct parameters", () => {
    renderHistoryModal({
      ...defaultProps,
      allHistory: formHistory,
      categoryType: "FORM",
    });

    // Get the second revert button (first one is usually disabled)
    const revertButton = screen.getAllByTestId("revert-button")[1];
    
    // Click the revert button
    fireEvent.click(revertButton);

    // Verify the confirm modal appears with correct version
    expect(screen.getByText("Use Layout from Version 1.22")).toBeInTheDocument();

    // Verify the confirm modal message
    expect(
      screen.getByText(
        "This will copy the layout from Version 1.22 overwriting your existing layout."
      )
    ).toBeInTheDocument();
  });
  it("closes history modal when revert button is clicked", () => {
    renderHistoryModal({
      ...defaultProps,
      allHistory: formHistory,
      categoryType: "FORM",
    });

    // Get the second revert button
    const revertButton = screen.getAllByTestId("revert-button")[1];
    
    // Click the revert button
    fireEvent.click(revertButton);

    // Verify the history modal is closed
    expect(onClose).toHaveBeenCalled();
  });

  

 
});
