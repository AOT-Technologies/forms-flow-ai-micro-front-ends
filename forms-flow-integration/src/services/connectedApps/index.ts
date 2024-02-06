/* istanbul ignore file */
import { RequestService } from "@formsflow/service";

import API from "../../endpoints/index";
 
export const fetchConnectedApps = ()=> RequestService.httpPOSTRequest(API.INTEGRATION_CONNECTED_APPS_URL);
 