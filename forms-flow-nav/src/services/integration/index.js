import { RequestService } from "@formsflow/service";
import API from "../../endpoints/index";

export const checkIntegrationEnabled= () => RequestService.httpGETRequest(API.INTEGRATION_ENABLE_DETAILS);