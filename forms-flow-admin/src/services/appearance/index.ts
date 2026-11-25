/* istanbul ignore file */
import { RequestService } from "@formsflow/service";
import { WEB_BASE_URL } from "../../endpoints/config";

const BRANDING_ENDPOINT = `${WEB_BASE_URL}/branding`;

export type ButtonShape = "rounded" | "square";

export interface BrandingDraft {
  displayName: string;
  buttonShape: ButtonShape;
}

export interface BrandingResponse {
  displayName: string | null;
  buttonShape: ButtonShape | null;
  logoUrl: string | null;
  logoName: string | null;
  logoUploadEnabled: boolean;
}

export const fetchBranding = (): Promise<BrandingResponse> =>
  RequestService.httpGETRequest(BRANDING_ENDPOINT).then((res: any) => res.data);

// Blank fields are stored as "default"; rounded is the default shape.
export const saveBranding = (
  draft: BrandingDraft,
  logoFile: File | null,
  removeLogo: boolean
): Promise<BrandingResponse> => {
  const form = new FormData();
  form.append("displayName", draft.displayName.trim());
  form.append("buttonShape", draft.buttonShape === "square" ? "square" : "");
  if (logoFile) form.append("logo", logoFile);
  else if (removeLogo) form.append("removeLogo", "true");
  return RequestService.httpPUTRequest(BRANDING_ENDPOINT, form).then(
    (res: any) => res.data
  );
};

export const resetBranding = (): Promise<BrandingResponse> =>
  RequestService.httpDELETERequest(BRANDING_ENDPOINT).then(
    (res: any) => res.data
  );
