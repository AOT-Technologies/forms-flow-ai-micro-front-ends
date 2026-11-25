// RequestService and offline detection (FFF-3): an API call that gets no
// answer at all asks the connection check to look now.

const mockReportNetworkError = jest.fn();
let mockOfflineEnabled = true;

jest.mock("../connectivity/connectivityService", () => ({
  __esModule: true,
  default: { reportNetworkError: () => mockReportNetworkError() },
}));
jest.mock("../offline/offlineSession", () => ({
  isOfflineEnabled: () => mockOfflineEnabled,
}));
jest.mock("../keycloak/KeycloakService", () => ({
  __esModule: true,
  default: { updateToken: jest.fn() },
}));

import axios from "axios";
import RequestService from "./requestService";

// The response interceptor's error handler, as axios would call it.
const onError = (error: any) =>
  (RequestService as any).axiosInstance.interceptors.response.handlers[0].rejected(error);

describe("RequestService offline detection", () => {
  beforeEach(() => {
    mockReportNetworkError.mockReset();
    mockOfflineEnabled = true;
  });

  it("reports a call that got no answer (network error)", async () => {
    const error = { message: "Network Error", code: "ERR_NETWORK", config: { headers: {} } };

    await expect(onError(error)).rejects.toBe(error);
    expect(mockReportNetworkError).toHaveBeenCalledTimes(1);
  });

  it("does not report an error reply from the server", async () => {
    const error = { response: { status: 500 }, config: { headers: {} } };

    await expect(onError(error)).rejects.toBe(error);
    expect(mockReportNetworkError).not.toHaveBeenCalled();
  });

  it("does not report a request the app cancelled", async () => {
    const error = new axios.Cancel("navigated away");
    (error as any).config = { headers: {} };

    await expect(onError(error)).rejects.toBe(error);
    expect(mockReportNetworkError).not.toHaveBeenCalled();
  });

  it("does nothing when offline support is off", async () => {
    mockOfflineEnabled = false;
    const error = { message: "Network Error", config: { headers: {} } };

    await expect(onError(error)).rejects.toBe(error);
    expect(mockReportNetworkError).not.toHaveBeenCalled();
  });
});
