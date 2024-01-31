/* istanbul ignore file */
import { RequestService } from "@formsflow/service";

import API from "../../endpoints/index";

export const fetchIntegrationEnableDetails = ()=> RequestService.httpGETRequest(API.INTEGRATION_ENABLE_DETAILS);
 