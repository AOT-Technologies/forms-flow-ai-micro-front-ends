import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import LogoUpload from "../LogoUpload";

// jsdom never loads images; report the size each test needs (or a decode error).
let nextImage: { width: number; height: number } | "error" = {
  width: 224,
  height: 96,
};
class FakeImage {
  naturalWidth = 0;
  naturalHeight = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    setTimeout(() => {
      if (nextImage === "error") return this.onerror?.();
      this.naturalWidth = nextImage.width;
      this.naturalHeight = nextImage.height;
      this.onload?.();
    });
  }
}
(global as any).Image = FakeImage;

const pngFile = (name = "logo.png", bytes = 64, type = "image/png") =>
  new File([new Uint8Array(bytes)], name, { type });

const setup = (enabled = true) => {
  const props = {
    enabled,
    selected: null,
    onSelect: jest.fn(),
    onClear: jest.fn(),
    onError: jest.fn(),
  };
  const view = render(<LogoUpload {...props} />);
  const input = view.container.querySelector(
    "input[type=file]"
  ) as HTMLInputElement;
  const pick = (file: File) =>
    act(() => {
      fireEvent.change(input, { target: { files: [file] } });
    });
  return { ...props, ...view, pick };
};

describe("LogoUpload", () => {
  beforeEach(() => {
    nextImage = { width: 224, height: 96 };
  });

  it("shows the empty drop area", () => {
    setup();
    expect(screen.getByTestId("appearance-logo-dropzone")).toHaveTextContent(
      "Choose an image or file to upload"
    );
  });

  it("rejects unsupported types", () => {
    const { pick, onError, onSelect } = setup();
    pick(pngFile("doc.pdf", 64, "application/pdf"));
    expect(onError).toHaveBeenCalledWith("Image file type is not supported");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("rejects files over 3MB", () => {
    const { pick, onError } = setup();
    pick(pngFile("big.png", 3 * 1024 * 1024 + 1));
    expect(onError).toHaveBeenCalledWith("Image is larger than 3MB");
  });

  it.each([
    [19, 200],
    [200, 19],
    [10, 10],
  ])("rejects a %ix%i image (under 20 x 20)", async (width, height) => {
    nextImage = { width, height };
    const { pick, onError, onSelect } = setup();
    pick(pngFile());
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Image is too small")
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("accepts an image of exactly 20 x 20", async () => {
    nextImage = { width: 20, height: 20 };
    const { pick, onSelect, onError } = setup();
    pick(pngFile());
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(onError).not.toHaveBeenCalled();
  });

  it("rejects files that are not decodable images", async () => {
    nextImage = "error";
    const { pick, onError } = setup();
    pick(pngFile());
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Image file type is not supported")
    );
  });

  it("shows the loading card, then hands over the selected logo", async () => {
    const { pick, onSelect } = setup();
    pick(pngFile("brand.png"));
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("brand.png")).toBeInTheDocument();
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ name: "brand.png" })
      )
    );
  });

  it("cancels a read in progress", async () => {
    const { pick, onSelect } = setup();
    pick(pngFile());
    fireEvent.click(screen.getByLabelText("Cancel upload"));
    expect(screen.getByTestId("appearance-logo-dropzone")).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 20));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows the selected card with a discard button", () => {
    const onClear = jest.fn();
    render(
      <LogoUpload
        enabled
        selected={{
          file: pngFile(),
          name: "brand.png",
          dataUrl: "data:image/png;base64,AA==",
        }}
        onSelect={jest.fn()}
        onClear={onClear}
        onError={jest.fn()}
      />
    );
    expect(screen.getByText("brand.png")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("appearance-logo-discard"));
    expect(onClear).toHaveBeenCalled();
  });

  it("is disabled when upload is not configured", () => {
    setup(false);
    expect(screen.getByTestId("appearance-logo-dropzone")).toBeDisabled();
  });
});
