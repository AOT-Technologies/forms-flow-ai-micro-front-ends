import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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
  it("click on load more button, form history", () => {
    const history = [...formHistory, ...formHistory, ...formHistory];
    renderHistoryModal({
      ...defaultProps,
      allHistory: history,
      historyCount: history.length,
      categoryType: "FORM",
    });
    const loadMoreButton = screen.getByText("load more");
    expect(loadMoreButton).toBeInTheDocument();
    fireEvent.click(loadMoreButton);
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
 
});
