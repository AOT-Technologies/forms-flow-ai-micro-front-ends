const mockPut = jest.fn(() => Promise.resolve({ data: { ok: true } }));
jest.mock("@formsflow/service", () => ({
  RequestService: {
    httpPUTRequest: (...args: unknown[]) => mockPut(...args),
  },
}));

import { saveBranding } from "..";

const sentForm = () => (mockPut.mock.calls[0] as unknown[])[1] as FormData;

describe("saveBranding", () => {
  beforeEach(() => mockPut.mockClear());

  it("sends trimmed text fields, with rounded (the default) as blank", async () => {
    await saveBranding(
      { displayName: "  Acme  ", buttonShape: "rounded" },
      null,
      false
    );
    const form = sentForm();
    expect(form.get("displayName")).toBe("Acme");
    expect(form.get("buttonShape")).toBe("");
    expect(form.has("logo")).toBe(false);
    expect(form.has("removeLogo")).toBe(false);
  });

  it("sends the chosen logo file", async () => {
    const logo = new File([new Uint8Array(4)], "acme.png", {
      type: "image/png",
    });
    await saveBranding({ displayName: "", buttonShape: "square" }, logo, false);
    const form = sentForm();
    expect(form.get("buttonShape")).toBe("square");
    expect((form.get("logo") as File).name).toBe("acme.png");
  });

  it("asks to remove the saved logo only when no new file is sent", async () => {
    await saveBranding({ displayName: "", buttonShape: "rounded" }, null, true);
    expect(sentForm().get("removeLogo")).toBe("true");
  });
});
