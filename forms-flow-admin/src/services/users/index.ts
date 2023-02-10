import { RequestService } from "@formsflow/service";

import API from "../../endpoints/index";


export const fetchUsers = (group: string | null, callback: any, errorHandler: any) => {
    let url = API.GET_USERS
    if(group){
        url=  `${url}?memberOfGroup=${group}`
    }
    RequestService.httpGETRequest(url)
      .then((res) => {
        if (res.data) {
          callback(res.data)
        } else {
          errorHandler("No Roles found!");
        }
      })
      .catch((error) => {
        if (error?.response?.data) {
          errorHandler(error.response.data);
        } else {
          errorHandler("Failed to fetch roles!");
        }
      });
};