import {
  completeChecklistByRouteKey as _completeChecklistByRouteKey,
  getStoredChecklistItems,
  storeChecklistItems,
} from "@formsflow/service";
import { RequestService } from "@formsflow/service";
import API from "../../endpoints/index";

export { getStoredChecklistItems, storeChecklistItems };

export const INVITE_USER_ROUTE_KEY = "invite-user";

const completeChecklistItem = (trackingId: number) =>
  RequestService.httpPUTRequest(`${API.CHECKLIST}/${trackingId}`, {});

export const completeChecklistByRouteKey = (routeKey: string) =>
  _completeChecklistByRouteKey(routeKey, completeChecklistItem);
