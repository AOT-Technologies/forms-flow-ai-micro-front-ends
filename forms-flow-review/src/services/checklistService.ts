import {
  completeChecklistByRouteKey as _completeChecklistByRouteKey,
  RequestService
} from "@formsflow/service";
import API from "../api/endpoints";

export const TASK_ASSIGN_ROUTE_KEY = "assign-task";

const completeChecklistItem = (trackingId: number) =>
  RequestService.httpPUTRequest(`${API.CHECKLIST}/${trackingId}`, {});

export const completeChecklistByRouteKey = (routeKey: string) =>
  _completeChecklistByRouteKey(routeKey, completeChecklistItem);
