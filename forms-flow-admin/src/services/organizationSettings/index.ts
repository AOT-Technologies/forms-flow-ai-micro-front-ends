import { RequestService } from "@formsflow/service";
import API from "../../endpoints";

// Organization settings (FFF-3): the offline switches on Manage -> Organization.
export interface OfflineSettings {
  /** Allowed on this installation (env key on the server). */
  available: boolean;
  enabled: boolean;
  autoSyncAvailable: boolean;
  autoSync: boolean;
}

export interface OrganizationSettings {
  offline: OfflineSettings;
}

export const fetchOrganizationSettings = (): Promise<OrganizationSettings> =>
  RequestService.httpGETRequest(API.ORGANIZATION_SETTINGS).then(
    (res: any) => res.data
  );

/** Changes one or both offline switches; resolves with the switches as saved. */
export const saveOfflineSettings = (change: {
  enabled?: boolean;
  autoSync?: boolean;
}): Promise<OrganizationSettings> =>
  RequestService.httpPUTRequest(API.ORGANIZATION_SETTINGS, {
    offline: change,
  }).then((res: any) => res.data);
