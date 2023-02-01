import axios from "axios";
import StorageService from "../storage/storageService";

class RequestService {
    /**
     * 
        Provides utility methods wrapping axios 
        to issue network requests.
     */

  public static httpGETRequest(
    url: string,
    data: object | null,
    token: string | null,
    isBearer: boolean = true,
    headers: object | null = null
  ): any {
    return axios.get(url, {
      params: data,
      headers: !headers
        ? {
            Authorization: isBearer
              ? `Bearer ${
                  token || StorageService.get(StorageService.User.AUTH_TOKEN)
                }`
              : token,
          }
        : headers,
    });
  }
  public static httpGETBlobRequest(
    url: string,
    data: object | null,
    token: string | null,
    isBearer: boolean = true,
    headers: object | null = null
  ): any {
    return axios.get(url, {
      params: data,
      responseType: "blob",
      headers: !headers
        ? {
            Authorization: isBearer
              ? `Bearer ${
                  token || StorageService.get(StorageService.User.AUTH_TOKEN)
                }`
              : token,
          }
        : headers,
    });
  }
  public static httpPOSTRequest(
    url: string,
    data: object,
    token: string | null,
    isBearer: boolean = true,
    headers: object | null = null
  ): any {
    return axios.post(url, data, {
      headers: !headers
        ? {
            Authorization: isBearer
              ? `Bearer ${
                  token || StorageService.get(StorageService.User.AUTH_TOKEN)
                }`
              : token,
          }
        : headers,
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
    return axios.post(url, data, {
      params: params,
      responseType: "blob",
      headers: !headers
        ? {
            Authorization: isBearer
              ? `Bearer ${
                  token || StorageService.get(StorageService.User.AUTH_TOKEN)
                }`
              : token,
          }
        : headers,
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
    isBearer: boolean = true
  ): any {
    return axios.post(url, data, {
      headers: {
        Authorization: isBearer
          ? `Bearer ${
              token || StorageService.get(StorageService.User.AUTH_TOKEN)
            }`
          : token,
        Accept: "application/hal+json",
      },
    });
  }
  public static httpPUTRequest(
    url: string,
    data: object,
    token: string | null,
    isBearer: boolean = true
  ): any {
    return axios.put(url, data, {
      headers: {
        Authorization: isBearer
          ? `Bearer ${
              token || StorageService.get(StorageService.User.AUTH_TOKEN)
            }`
          : token,
      },
    });
  }
  public static httpDELETERequest(
    url: string,
    token: string | null,
    isBearer: boolean = true
  ): any {
    return axios.delete(url, {
      headers: {
        Authorization: isBearer
          ? `Bearer ${
              token || StorageService.get(StorageService.User.AUTH_TOKEN)
            }`
          : token,
      },
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