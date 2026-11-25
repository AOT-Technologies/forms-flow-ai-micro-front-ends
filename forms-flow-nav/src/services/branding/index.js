import { RequestService } from "@formsflow/service";
import API from "../../endpoints/index";

export const fetchBranding = () => RequestService.httpGETRequest(API.BRANDING);
