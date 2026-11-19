const mockGet = jest.fn();
jest.mock("@formsflow/service", () => ({
  RequestService: {
    httpGETRequest: (...args: unknown[]) => mockGet(...args),
  },
}));
jest.mock("@formsflow/components", () => ({}));

import { fetchStyleTemplates } from "..";

const template = (styleData: Record<string, unknown>) => ({
  id: 1,
  name: "Brand",
  styleData,
});

describe("fetchStyleTemplates branding logo", () => {
  beforeEach(() => mockGet.mockReset());

  it("treats a template saved without brandingLogo as showing the badge", async () => {
    mockGet.mockResolvedValue({ data: [template({ accentColor: "#123456" })] });
    const [tpl] = await fetchStyleTemplates();
    expect(tpl.styleData.brandingLogo).toBe("formsflow");
  });

  it("keeps an explicit none", async () => {
    mockGet.mockResolvedValue({ data: [template({ brandingLogo: "none" })] });
    const [tpl] = await fetchStyleTemplates();
    expect(tpl.styleData.brandingLogo).toBe("none");
  });
});
