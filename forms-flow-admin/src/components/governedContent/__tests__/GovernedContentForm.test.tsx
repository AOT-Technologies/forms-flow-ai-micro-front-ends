import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import GovernedContentForm, { NEW_BLOCK_ID } from "../GovernedContentForm";
import {
  createGovernedContent,
  fetchGovernedContent,
  retireGovernedContent,
  updateGovernedContent,
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
  createGovernedContent: jest.fn(),
  fetchGovernedContent: jest.fn(),
  retireGovernedContent: jest.fn(),
  updateGovernedContent: jest.fn(),
}));

jest.mock("@formsflow/components", () => ({
  CustomInfo: ({ content, dataTestId }: any) => (
    <div data-testid={dataTestId}>{content}</div>
  ),
  V8CustomButton: ({ label, onClick, disabled, dataTestId }: any) => (
    <button data-testid={dataTestId} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
  FormInput: ({
    id,
    label,
    value,
    onChange,
    dataTestId,
    isInvalid,
    feedback,
  }: any) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={onChange}
        data-testid={dataTestId}
      />
      {isInvalid && <span role="alert">{feedback}</span>}
    </div>
  ),
  CustomRadioButton: ({ items, selectedValue, onChange, dataTestId }: any) => (
    <div>
      {items.map((item: any, index: number) => (
        <label key={item.value}>
          <input
            type="radio"
            checked={selectedValue === item.value}
            onChange={(event) => onChange(item.value, event)}
            data-testid={`${dataTestId}-inline-radio-${index + 1}`}
          />
          {item.label}
        </label>
      ))}
    </div>
  ),
  PromptModal: ({
    show,
    title,
    message,
    dataTestId,
    primaryBtnText,
    primaryBtnAction,
    primaryBtndataTestid,
    secondaryBtnText,
    secondaryBtnAction,
    secondoryBtndataTestid,
  }: any) =>
    show ? (
      <div data-testid={dataTestId}>
        <h2>{title}</h2>
        <div>{message}</div>
        <button
          data-testid={secondoryBtndataTestid}
          onClick={secondaryBtnAction}
        >
          {secondaryBtnText}
        </button>
        <button data-testid={primaryBtndataTestid} onClick={primaryBtnAction}>
          {primaryBtnText}
        </button>
      </div>
    ) : null,
}));

const mockCreate = createGovernedContent as jest.Mock;
const mockFetch = fetchGovernedContent as jest.Mock;
const mockUpdate = updateGovernedContent as jest.Mock;
const mockRetire = retireGovernedContent as jest.Mock;

const type = (testId: string, value: string) =>
  fireEvent.change(screen.getByTestId(testId), { target: { value } });

const typeBody = (html: string) => {
  const area = screen.getByTestId("governed-body-editor-area");
  area.innerHTML = html;
  fireEvent.input(area);
};

const fillRequiredFields = (requirement: 1 | 2 = 1) => {
  type("governed-name-input", "Claims privacy notice");
  type("governed-heading-input", "Collection of personal information");
  typeBody("<p>Questions go to the Privacy Office.</p>");
  type("governed-owner-input", "Legal");
  fireEvent.click(
    screen.getByTestId(`governed-requirement-inline-radio-${requirement}`)
  );
};

const submit = () => screen.getByTestId("governed-form-submit");

describe("GovernedContentForm — new block", () => {
  beforeEach(() => jest.clearAllMocks());

  it("keeps Create block disabled until name, body, owner and type are set", () => {
    render(<GovernedContentForm blockId={NEW_BLOCK_ID} onClose={jest.fn()} />);
    expect(screen.getByText("New block")).toBeInTheDocument();
    expect(
      screen.queryByTestId("governed-form-notice")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("governed-form-retire")
    ).not.toBeInTheDocument();
    expect(submit()).toBeDisabled();

    type("governed-name-input", "Claims privacy notice");
    typeBody("<p>Body</p>");
    type("governed-owner-input", "Legal");
    expect(submit()).toBeDisabled();

    fireEvent.click(screen.getByTestId("governed-requirement-inline-radio-2"));
    expect(submit()).toBeEnabled();
  });

  it("previews the heading and body as submitters will see them", () => {
    render(<GovernedContentForm blockId={NEW_BLOCK_ID} onClose={jest.fn()} />);
    expect(
      screen.getByText(
        "The heading and body appear here as submitters will see them."
      )
    ).toBeInTheDocument();

    type("governed-heading-input", "Collection of personal information");
    typeBody('<p>Ask the <a href="https://example.org">Privacy Office</a></p>');

    expect(screen.getByTestId("governed-preview-heading")).toHaveTextContent(
      "Collection of personal information"
    );
    expect(
      within(screen.getByTestId("governed-preview-body")).getByRole("link", {
        name: "Privacy Office",
      })
    ).toHaveAttribute("target", "_blank");
  });

  it("confirms a required block before creating it", async () => {
    const onClose = jest.fn();
    mockCreate.mockResolvedValue({ id: 1 });
    render(<GovernedContentForm blockId={NEW_BLOCK_ID} onClose={onClose} />);
    fillRequiredFields(1);

    fireEvent.click(submit());
    expect(mockCreate).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Claims privacy notice will be required on every form. Each one picks it up the next time someone opens and saves it."
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("governed-confirm-required-create"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith({
      name: "Claims privacy notice",
      requirement: "required",
      component: {
        type: "content",
        key: "governedClaimsPrivacyNotice",
        input: false,
        html: "<h4>Collection of personal information</h4><p>Questions go to the Privacy Office.</p>",
        properties: { governedOwner: "Legal" },
      },
    });
    expect(toast.success).toHaveBeenCalledWith("Block created successfully");
  });

  it("creates an optional block without confirmation", async () => {
    const onClose = jest.fn();
    mockCreate.mockResolvedValue({ id: 1 });
    render(<GovernedContentForm blockId={NEW_BLOCK_ID} onClose={onClose} />);
    fillRequiredFields(2);

    fireEvent.click(submit());
    expect(
      screen.queryByTestId("governed-confirm-required-modal")
    ).not.toBeInTheDocument();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockCreate.mock.calls[0][0].requirement).toBe("optional");
  });

  it("shows a duplicate name on the Name field and stays on the form", async () => {
    const onClose = jest.fn();
    mockCreate.mockRejectedValue({
      response: {
        data: {
          code: "GOVERNED_CONTENT_NAME_EXISTS",
          message: "Active governed content with this name already exists",
        },
      },
    });
    render(<GovernedContentForm blockId={NEW_BLOCK_ID} onClose={onClose} />);
    fillRequiredFields(2);
    fireEvent.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Active governed content with this name already exists"
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("reports other save failures with the API message", async () => {
    mockCreate.mockRejectedValue({
      response: {
        data: {
          message: "Validation failed",
          details: [{ message: "component.key is required" }],
        },
      },
    });
    render(<GovernedContentForm blockId={NEW_BLOCK_ID} onClose={jest.fn()} />);
    fillRequiredFields(2);
    fireEvent.click(submit());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("component.key is required")
    );
    expect(submit()).toBeEnabled();
  });

  it("leaves straight away when nothing changed", () => {
    const onClose = jest.fn();
    render(<GovernedContentForm blockId={NEW_BLOCK_ID} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("governed-form-cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("asks before discarding unsaved changes", () => {
    const onClose = jest.fn();
    render(<GovernedContentForm blockId={NEW_BLOCK_ID} onClose={onClose} />);
    type("governed-name-input", "Draft");

    fireEvent.click(screen.getByTestId("governed-form-cancel"));
    expect(screen.getByText("You have unsaved changes")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("governed-unsaved-keep-editing"));
    expect(
      screen.queryByTestId("governed-unsaved-modal")
    ).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("governed-form-cancel"));
    fireEvent.click(screen.getByTestId("governed-unsaved-discard"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("GovernedContentForm — edit block", () => {
  beforeEach(() => jest.clearAllMocks());

  const record = {
    id: 7,
    name: "Claims privacy notice",
    requirement: "required",
    status: "active",
    version: 2,
    component: {
      type: "content",
      key: "governedOriginalKey",
      html: "<h4>Collection</h4><p>Body</p>",
      properties: { governedOwner: "Legal" },
    },
  };

  it("loads the block and saves changes under its existing key", async () => {
    const onClose = jest.fn();
    mockFetch.mockResolvedValue(record);
    mockUpdate.mockResolvedValue(record);
    render(<GovernedContentForm blockId="7" onClose={onClose} />);

    expect(await screen.findByText("Edit block")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith("7");
    expect(screen.getByTestId("governed-form-notice")).toHaveTextContent(
      "Changes reach each form the next time someone opens and saves it."
    );
    expect(screen.getByTestId("governed-name-input")).toHaveValue(
      "Claims privacy notice"
    );
    expect(screen.getByTestId("governed-body-editor-area").innerHTML).toBe(
      "<p>Body</p>"
    );
    expect(submit()).toBeDisabled();

    type("governed-owner-input", "Privacy Office");
    // An edit reaches every form carrying the block, so it is confirmed;
    // the required-block question is only for new blocks.
    fireEvent.click(submit());
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("governed-confirm-required-modal")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Save this change?")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("governed-confirm-save"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockUpdate).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        component: expect.objectContaining({
          key: "governedOriginalKey",
          properties: { governedOwner: "Privacy Office" },
        }),
      })
    );
  });

  it("keeps editing when the change confirmation is cancelled", async () => {
    mockFetch.mockResolvedValue(record);
    render(<GovernedContentForm blockId="7" onClose={jest.fn()} />);
    await screen.findByText("Edit block");

    type("governed-owner-input", "Privacy Office");
    fireEvent.click(submit());
    fireEvent.click(screen.getByTestId("governed-confirm-save-cancel"));

    expect(
      screen.queryByTestId("governed-confirm-save-modal")
    ).not.toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(submit()).toBeEnabled();
  });

  it("retires the block after confirmation and returns to the library", async () => {
    const onClose = jest.fn();
    mockFetch.mockResolvedValue(record);
    mockRetire.mockResolvedValue({ ...record, status: "retired" });
    render(<GovernedContentForm blockId="7" onClose={onClose} />);
    await screen.findByText("Edit block");

    fireEvent.click(screen.getByTestId("governed-form-retire"));
    expect(mockRetire).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Claims privacy notice is removed from each form carrying it the next time that form is opened and saved."
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("governed-confirm-retire"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockRetire).toHaveBeenCalledWith(7);
    expect(toast.success).toHaveBeenCalledWith("Block retired successfully");
  });

  it("stays on the page and reports a failed retire", async () => {
    const onClose = jest.fn();
    mockFetch.mockResolvedValue(record);
    mockRetire.mockRejectedValue({
      response: { data: { message: "Governed content not found" } },
    });
    render(<GovernedContentForm blockId="7" onClose={onClose} />);
    await screen.findByText("Edit block");

    fireEvent.click(screen.getByTestId("governed-form-retire"));
    fireEvent.click(screen.getByTestId("governed-confirm-retire"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Governed content not found")
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("governed-confirm-retire-modal")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("governed-form-retire")).toBeEnabled();
  });

  it("opens a retired block read-only, with no actions", async () => {
    mockFetch.mockResolvedValue({
      ...record,
      requirement: "optional",
      status: "retired",
      retired: "2026-10-04T10:00:00",
    });
    render(<GovernedContentForm blockId="7" onClose={jest.fn()} />);

    expect(await screen.findByText("View block")).toBeInTheDocument();
    expect(screen.getByTestId("governed-view-retired")).toHaveTextContent(
      "Retired"
    );
    // The service mock's getLocaldate returns the date unchanged.
    expect(screen.getByTestId("governed-view-notice")).toHaveTextContent(
      "Retired on 2026-10-04T10:00:00. It comes off each form the next time the form is opened and saved."
    );
    const details = within(screen.getByTestId("governed-content-view"));
    expect(details.getByText("Claims privacy notice")).toBeInTheDocument();
    expect(details.getByText("Legal")).toBeInTheDocument();
    expect(
      details.getByText("Optional — designers switch it on")
    ).toBeInTheDocument();
    expect(screen.getByTestId("governed-preview-heading")).toHaveTextContent(
      "Collection"
    );
    expect(screen.queryByTestId("governed-name-input")).toBeNull();
    expect(screen.queryByTestId("governed-form-submit")).toBeNull();
    expect(screen.queryByTestId("governed-form-retire")).toBeNull();
  });

  it("opens an active block read-only while governed content is off", async () => {
    mockFetch.mockResolvedValue(record);
    render(<GovernedContentForm blockId="7" onClose={jest.fn()} readOnly />);

    expect(await screen.findByText("View block")).toBeInTheDocument();
    expect(screen.queryByTestId("governed-view-retired")).toBeNull();
    expect(screen.getByTestId("governed-view-notice")).toHaveTextContent(
      "Governed content is off. Blocks can’t be created, changed or retired."
    );
    expect(screen.queryByTestId("governed-name-input")).toBeNull();
    expect(screen.queryByTestId("governed-form-retire")).toBeNull();
  });

  it("shows a load failure without breaking the screen", async () => {
    const onClose = jest.fn();
    mockFetch.mockRejectedValue({
      response: { data: { message: "Governed content not found" } },
    });
    render(<GovernedContentForm blockId="99" onClose={onClose} />);

    expect(
      await screen.findByTestId("governed-form-load-error")
    ).toHaveTextContent("Governed content not found");
    fireEvent.click(screen.getByTestId("governed-form-back"));
    expect(onClose).toHaveBeenCalled();
  });

  it("ignores a load that finishes after leaving", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    mockFetch.mockReturnValue(new Promise((r) => (resolve = r)));
    const { unmount } = render(
      <GovernedContentForm blockId="7" onClose={jest.fn()} />
    );
    unmount();
    await act(async () => resolve(record));
  });
});
