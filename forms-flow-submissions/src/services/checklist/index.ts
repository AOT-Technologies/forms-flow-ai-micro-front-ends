import {
  completeChecklistByRouteKey as _completeChecklistByRouteKey,
  RequestService
} from "@formsflow/service";
import API from "../../api/endpoints";


const completeChecklistItem = (trackingId: number) =>
  RequestService.httpPUTRequest(`${API.CHECKLIST}/${trackingId}`, {});

export const completeChecklistByRouteKey = (routeKey: string) =>
  _completeChecklistByRouteKey(routeKey, completeChecklistItem);
