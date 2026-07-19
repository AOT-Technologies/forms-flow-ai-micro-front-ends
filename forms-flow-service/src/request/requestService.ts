import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
} from "axios";
import StorageService from "../storage/storageService";
// Import the module directly, not via "../formsflow-services": the barrel also
// imports this file, so going through it creates a module cycle (S.11).
import KeycloakService from "../keycloak/KeycloakService";

class RequestService {
  /**
     * 
        Provides utility methods wrapping axios 
        to issue network requests.
     */

  private static axiosInstance: AxiosInstance = RequestService.initAxios();

  private static initAxios(): AxiosInstance {
    const instance = axios.create();

    instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        const isUnauthorized = error.response?.status === 401;
        const hasNoJwtHeader = !originalRequest.headers?.["x-jwt-token"];
        const notAlreadyRetried = !originalRequest._retry;

        if (isUnauthorized && hasNoJwtHeader && notAlreadyRetried) {
          originalRequest._retry = true;
          try {
            const newToken = await KeycloakService.updateToken().catch(() => {
              // Same rejection value as before: callers see this Error, not the
              // raw keycloak failure.
              throw new Error("Failed to refresh token");
            });

            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newToken}`,
            };

            return instance(originalRequest);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }

  // Shared Authorization-header builders (S.9). Semantics are identical to the
  // ternaries previously copy-pasted into every request method: bearer mode
  // falls back to the stored auth token; custom `headers` win when provided.
  private static authorizationValue(
    token: string | null,
    isBearer: boolean
  ): string | null {
    return isBearer
      ? `Bearer ${token || StorageService.get(StorageService.User.AUTH_TOKEN)}`
      : token;
  }

  private static authHeaders(
    token: string | null,
    isBearer: boolean,
    headers: object | null = null
  ): object {
    return !headers
      ? { Authorization: this.authorizationValue(token, isBearer) }
      : headers;
  }

  public static httpGETRequest(
    url: string,
    data: object | null,
    token: string | null,
    isBearer: boolean = true,
    headers: object | null = null
  ): any {
    return this.axiosInstance.get(url, {
      params: data,
      headers: this.authHeaders(token, isBearer, headers),
    });
  }
  public static httpGETBlobRequest(
    url: string,
    data: object | null,
    token: string | null,
    isBearer: boolean = true,
    headers: object | null = null
  ): any {
    return this.axiosInstance.get(url, {
      params: data,
      responseType: "blob",
      headers: this.authHeaders(token, isBearer, headers),
    });
  }
  public static httpPOSTRequest(
    url: string,
    data: object,
    token: string | null,
    isBearer: boolean = true,
    headers: object | null = null
  ): any {
    return this.axiosInstance.post(url, data, {
      headers: this.authHeaders(token, isBearer, headers),
    });
  }

  public static httpMultipartPOSTRequest(
    url: string,
    importData: File,
    supportData: string,
    token: string | null,
    isBearer: boolean = true,
    headers: object | null = null
  ): any {
    const formData = new FormData();
    formData.append("file", importData);
    formData.append("data", supportData);
    return this.axiosInstance.post(url, formData, {
      headers: {
        ...headers,
        Authorization: this.authorizationValue(token, isBearer),
        "Content-Type": "multipart/form-data",
      },
    });
  }

  public static httpPOSTBlobRequest(
    url: string,
    params: object | null,
    data: object,
    token: string | null,
    isBearer: boolean = true,
    headers: object | null = null
  ): any {
    return this.axiosInstance.post(url, data, {
      params: params,
      responseType: "blob",
      headers: this.authHeaders(token, isBearer, headers),
    });
  }
  public static httpPOSTRequestWithoutToken(url: string, data: object): any {
    return axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  public static httpPOSTRequestWithHAL(
    url: string,
    data: object,
    token: string | null,
    isBearer: boolean = true,
    signal?: AbortSignal
  ): any {
    return this.axiosInstance.post(url, data, {
      headers: {
        Authorization: this.authorizationValue(token, isBearer),
        Accept: "application/hal+json",
      },
      signal,
    });
  }
  public static httpPUTRequest(
    url: string,
    data: object,
    token: string | null,
    isBearer: boolean = true
  ): any {
    return this.axiosInstance.put(url, data, {
      headers: this.authHeaders(token, isBearer),
    });
  }
  public static httpDELETERequest(
    url: string,
    data: object,
    token: string | null,
    isBearer: boolean = true
  ): any {
    return this.axiosInstance.delete(url, {
      headers: this.authHeaders(token, isBearer),
      data: data,
    });
  }
  public static httpPUTRequestWithoutToken(url: string, data: object): any {
    return axios.put(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export default RequestService;
