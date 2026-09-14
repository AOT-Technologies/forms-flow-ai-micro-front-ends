import { RequestService } from "@formsflow/service";
import API from "../endPoints/index";
import { SUBMISSION_FEATURE_KEY } from "../../helpers/usageHelpers";

/**
 * Metered feature usage, read from the admin API.
 *
 * Shared rather than duplicated per host, matching `fetchAndStoreFormioRoles`: the home
 * banner and the organization card read the same endpoint.
 */

/** Body of `GET /features/{key}/usage`. */
export interface FeatureUsageResponse {
  /** Submissions recorded in the tenant's current usage period. */
  used: number;
  /** Allowance for the period. Null means unlimited or unconfigured. */
  total?: number | null;
  /** Plan name as recorded in the admin database, e.g. "Go", "Professional Plan". */
  plan?: string | null;
  /** Inclusive period bounds, and the day the allowance resets. ISO dates. */
  period_start?: string | null;
  period_end?: string | null;
  resets_on?: string | null;
}

/**
 * Fetch a tenant's current-period usage of one feature.
 *
 * The tenant comes from the bearer token, never from the caller.
 */
export const fetchFeatureUsage = async (
  featureKey: string = SUBMISSION_FEATURE_KEY
): Promise<FeatureUsageResponse> => {
  const url = API.GET_FEATURE_USAGE.replace("<feature_key>", featureKey);
  const response = await RequestService.httpGETRequest(url);
  return response?.data;
};
