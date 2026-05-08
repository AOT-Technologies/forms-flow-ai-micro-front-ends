import {
  completeChecklistByRouteKey as _completeChecklistByRouteKey,
  RequestService 
} from "@formsflow/service";
import API from "../../endpoints/index";

export const INVITE_USER_ROUTE_KEY = "invite-user";

const completeChecklistItem = (trackingId: number) =>
  RequestService.httpPUTRequest(`${API.CHECKLIST}/${trackingId}`, {});

export const completeChecklistByRouteKey = (routeKey: string) =>
  _completeChecklistByRouteKey(routeKey, completeChecklistItem);
