/* istanbul ignore file */
import { RequestService } from "@formsflow/service";

import API from "../../endpoints/index";
 
export const fetchRecipesUrls = ()=> RequestService.httpPOSTRequest(API.INTEGRATION_RECIPES_URL);
 