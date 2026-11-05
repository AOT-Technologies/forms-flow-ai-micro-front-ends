/* istanbul ignore file */
import { RequestService } from "@formsflow/service";
import API from "../../endpoints/index";

export type GovernedRequirement = "required" | "optional";

// The form.io component the API stores and embeds on forms.
export interface GovernedComponent {
  type: string;
  key: string;
  html?: string;
  properties?: Record<string, string>;
  [attribute: string]: unknown;
}

export interface GovernedContentRecord {
  id: number;
  name: string;
  description?: string | null;
  requirement: GovernedRequirement;
  status: "active" | "retired";
  component: GovernedComponent;
  version: number;
  // When the block was retired (ISO date-time); null while active.
  retired?: string | null;
}

export interface GovernedContentPayload {
  name: string;
  requirement: GovernedRequirement;
  component: GovernedComponent;
}

// API error code for a name already used by active content.
export const NAME_EXISTS_ERROR = "GOVERNED_CONTENT_NAME_EXISTS";

const itemUrl = (id: number | string) => `${API.GOVERNED_CONTENT}/${id}`;

// Active and retired content: retired blocks stay in the library (REV 3.4).
export const fetchGovernedContentList = (): Promise<GovernedContentRecord[]> =>
  RequestService.httpGETRequest(API.GOVERNED_CONTENT).then(
    (res: any) => res.data ?? []
  );

export const fetchGovernedContent = (
  id: number | string
): Promise<GovernedContentRecord> =>
  RequestService.httpGETRequest(itemUrl(id)).then((res: any) => res.data);

export const createGovernedContent = (
  payload: GovernedContentPayload
): Promise<GovernedContentRecord> =>
  RequestService.httpPOSTRequest(API.GOVERNED_CONTENT, payload).then(
    (res: any) => res.data
  );

export const updateGovernedContent = (
  id: number | string,
  payload: GovernedContentPayload
): Promise<GovernedContentRecord> =>
  RequestService.httpPUTRequest(itemUrl(id), payload).then(
    (res: any) => res.data
  );

// Retires the content; forms drop it the next time they are opened and saved.
export const retireGovernedContent = (
  id: number | string
): Promise<GovernedContentRecord> =>
  RequestService.httpDELETERequest(itemUrl(id)).then((res: any) => res.data);

export const getApiErrorCode = (error: any): string | undefined =>
  error?.response?.data?.code;

/** The API's most specific message ({ message, details[] }), else the fallback. */
export const getApiErrorMessage = (error: any, fallback: string): string => {
  const data = error?.response?.data;
  const detail = data?.details?.[0]?.message;
  if (typeof detail === "string" && detail) return detail;
  return typeof data?.message === "string" && data.message
    ? data.message
    : fallback;
};
