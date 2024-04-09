/* istanbul ignore file */
import { RequestService } from "@formsflow/service";

import API from "../../endpoints/index";
 
export const fetchLibrary = ()=> RequestService.httpPOSTRequest(API.INTEGRATION_LIBRARY_URL);
