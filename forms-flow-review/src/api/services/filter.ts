/* istanbul ignore file */

//this is sample code
import { RequestService } from "@formsflow/service";

import API from "../endpoints";
 
export const filterCreate = ()=> RequestService.httpPOSTRequest(API.SAMPLE);
