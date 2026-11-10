import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import GovernedContentList from "../GovernedContentList";
import {
  fetchGovernedContentList,
  retireGovernedContent,
} from "../../../services/governedContent";
import { toast } from "react-toastify";

jest.mock("react-i18next", () => {
  const t = (key: string, options?: Record<string, string>) =>
    options ? key.replace(/{{(\w+)}}/g, (_match, name) => options[name]) : key;
  return { useTranslation: () => ({ t }) };
});

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("../../../services/governedContent", () => ({
  ...jest.requireActual("../../../services/governedContent"),
  fetchGovernedContentList: jest.fn(),
  retireGovernedContent: jest.fn(),
}));

// The grid is the shared ReusableTable; render just its cells and overlay.
jest.mock("@formsflow/components", () => ({
  V8CustomButton: ({ label, onClick, disabled, dataTestId }: any) => (
    <button data-testid={dataTestId} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
  V8CustomDropdownButton: ({
    label,
    onLabelClick,
    dropdownItems,
    disabled,
    dataTestId,
  }: any) => (
    <div>
      <button
        data-testid={dataTestId}
        onClick={onLabelClick}
        disabled={disabled}
      >
        {label}
      </button>
      {dropdownItems.map((item: any) => (
        <button
          key={item.value}
          data-testid={item.dataTestId}
          onClick={item.onClick}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
  ReusableTable: ({ rows, columns, loading, customSlots }: any) => {
    if (loading) return <div>loading</div>;
    const Empty = customSlots.noRowsOverlay;
    return (
      <table>
        <thead>
          <tr>
            {columns.map((column: any) => (
              <th key={column.field}>
                {column.renderHeader
                  ? column.renderHeader()
                  : column.headerName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any) => (
            <tr key={row.id} data-testid="row">
              {columns.map((column: any) => (
                <td key={column.field}>
                  {column.renderCell
                    ? column.renderCell({ row })
                    : row[column.field]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {rows.length === 0 && (
          <tfoot>
            <tr>
              <td>
                <Empty />
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    );
  },
  PromptModal: ({
    show,
    title,
    message,
    primaryBtnText,
    primaryBtnAction,
    primaryBtndataTestid,
  }: any) =>
    show ? (
      <div role="dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <button data-testid={primaryBtndataTestid} onClick={primaryBtnAction}>
          {primaryBtnText}
        </button>
      </div>
    ) : null,
}));

const mockFetchList = fetchGovernedContentList as jest.Mock;
const mockRetire = retireGovernedContent as jest.Mock;

const record = (
  id: number,
  name: string,
  requirement: string,
  owner: string,
  policy?: string
) => ({
  id,
  name,
  requirement,
  status: "active",
  version: 1,
  component: {
    type: "content",
    key: `k${id}`,
    properties: {
      governedOwner: owner,
      ...(policy ? { governedPolicyReference: policy } : {}),
    },
  },
});

const LIBRARY = [
  record(4, "Marketing footer", "optional", "Marketing", "Brand Standard"),
  record(2, "Records retention notice", "required", "Legal"),
  record(3, "Accessibility accommodation", "optional", "Legal"),
  record(
    1,
    "Collection of personal information",
    "required",
    "Legal",
    "Privacy Policy §4.2"
  ),
];

const rowTexts = () =>
  screen
    .getAllByTestId("row")
    .map((row) => row.querySelector("td")?.textContent);

describe("GovernedContentList", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists required blocks first, with owner and policy reference", async () => {
    mockFetchList.mockResolvedValue(LIBRARY);
    render(<GovernedContentList onCreate={jest.fn()} onEdit={jest.fn()} />);

    await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(4));
    expect(rowTexts()).toEqual([
      "Collection of personal information",
      "Records retention notice",
      "Accessibility accommodation",
      "Marketing footer",
    ]);
    const first = within(screen.getAllByTestId("row")[0]);
    expect(first.getByText("Required")).toBeInTheDocument();
    expect(first.getByText("Legal")).toBeInTheDocument();
    expect(first.getByText("Privacy Policy §4.2")).toBeInTheDocument();
  });

  it("opens a block for editing", async () => {
    const onEdit = jest.fn();
    mockFetchList.mockResolvedValue(LIBRARY);
    render(<GovernedContentList onCreate={jest.fn()} onEdit={onEdit} />);

    fireEvent.click(await screen.findByTestId("governed-content-edit-3"));
    expect(onEdit).toHaveBeenCalledWith(3);
  });

  it("is read-only while governed content is off", async () => {
    const onOpenOrganization = jest.fn();
    mockFetchList.mockResolvedValue([
      { ...record(5, "Old notice", "optional", "Legal"), status: "retired" },
      ...LIBRARY,
    ]);
    render(
      <GovernedContentList
        onCreate={jest.fn()}
        onEdit={jest.fn()}
        readOnly
        onOpenOrganization={onOpenOrganization}
      />
    );

    await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(5));
    expect(screen.getByTestId("governed-content-off-notice")).toHaveTextContent(
      "Governed content is off. Blocks can’t be created, changed or retired."
    );
    expect(screen.getByTestId("governed-content-edit-1")).toBeDisabled();
    // Retired blocks are read-only anyway, so View stays available.
    expect(screen.getByTestId("governed-content-view-5")).toBeEnabled();
    expect(screen.getByTestId("governed-content-refresh")).toBeEnabled();

    fireEvent.click(screen.getByTestId("governed-content-go-to-organization"));
    expect(onOpenOrganization).toHaveBeenCalled();
  });

  it("points to Organization from the zero state while off", async () => {
    mockFetchList.mockResolvedValue([]);
    render(
      <GovernedContentList onCreate={jest.fn()} onEdit={jest.fn()} readOnly />
    );

    expect(
      await screen.findByText(
        "Once governed content is on, blocks you create here give form designers approved wording, like a privacy or retention notice."
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId("governed-content-off-notice")).toHaveTextContent(
      "Governed content is off. Turn it on in Organization to start creating blocks."
    );
    expect(screen.getByTestId("governed-content-empty-create")).toBeDisabled();
    // No way into Organization for this user, so no button.
    expect(
      screen.queryByTestId("governed-content-go-to-organization")
    ).toBeNull();
  });

  it("shows the zero state with a way to create the first block", async () => {
    const onCreate = jest.fn();
    mockFetchList.mockResolvedValue([]);
    render(<GovernedContentList onCreate={onCreate} onEdit={jest.fn()} />);

    expect(
      await screen.findByText("No governed content yet")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("governed-content-empty-create"));
    expect(onCreate).toHaveBeenCalled();
  });

  it("shows a load failure and retries", async () => {
    mockFetchList.mockRejectedValueOnce({
      response: { data: { message: "Invalid Token Error" } },
    });
    mockFetchList.mockResolvedValueOnce(LIBRARY);
    render(<GovernedContentList onCreate={jest.fn()} onEdit={jest.fn()} />);

    expect(await screen.findByText("Invalid Token Error")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("governed-content-retry"));
    await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(4));
  });

  it("refetches on Refresh", async () => {
    mockFetchList.mockResolvedValue(LIBRARY);
    render(<GovernedContentList onCreate={jest.fn()} onEdit={jest.fn()} />);
    fireEvent.click(await screen.findByTestId("governed-content-refresh"));
    await waitFor(() => expect(mockFetchList).toHaveBeenCalledTimes(2));
  });

  it("keeps retired blocks last, badged, with View instead of Edit", async () => {
    const onEdit = jest.fn();
    mockFetchList.mockResolvedValue([
      {
        ...record(5, "Accessibility notice", "required", "Legal"),
        status: "retired",
      },
      ...LIBRARY,
    ]);
    render(<GovernedContentList onCreate={jest.fn()} onEdit={onEdit} />);

    await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(5));
    expect(rowTexts()[4]).toBe("Accessibility noticeRetired");
    expect(
      screen.getByTestId("governed-content-retired-5")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("governed-content-retired-4")).toBeNull();
    expect(screen.queryByTestId("governed-content-edit-5")).toBeNull();
    expect(screen.queryByTestId("governed-content-retire-5")).toBeNull();

    fireEvent.click(screen.getByTestId("governed-content-view-5"));
    expect(onEdit).toHaveBeenCalledWith(5);
  });

  it("confirms, retires and reloads", async () => {
    mockFetchList.mockResolvedValue(LIBRARY);
    mockRetire.mockResolvedValue({});
    render(<GovernedContentList onCreate={jest.fn()} onEdit={jest.fn()} />);

    fireEvent.click(await screen.findByTestId("governed-content-retire-4"));
    expect(screen.getByText("Retire this block?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Marketing footer is removed from each form carrying it the next time that form is opened and saved."
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("governed-content-retire-confirm"));

    await waitFor(() => expect(mockRetire).toHaveBeenCalledWith(4));
    await waitFor(() => expect(mockFetchList).toHaveBeenCalledTimes(2));
    expect(toast.success).toHaveBeenCalledWith("Block retired successfully");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reports a failed retire and keeps the list", async () => {
    mockFetchList.mockResolvedValue(LIBRARY);
    mockRetire.mockRejectedValue({
      response: {
        data: { message: "Governed content is retired and cannot be changed" },
      },
    });
    render(<GovernedContentList onCreate={jest.fn()} onEdit={jest.fn()} />);

    fireEvent.click(await screen.findByTestId("governed-content-retire-4"));
    fireEvent.click(screen.getByTestId("governed-content-retire-confirm"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Governed content is retired and cannot be changed"
      )
    );
    expect(screen.getAllByTestId("row")).toHaveLength(4);
  });
});
