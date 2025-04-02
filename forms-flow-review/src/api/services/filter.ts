/* istanbul ignore file */

//this is sample code
import { RequestService,StorageService  } from "@formsflow/service";

import API from "../endpoints";
 
export const filterCreate = ()=> RequestService.httpPOSTRequest(API.SAMPLE);

export const fetchAllForms = ()=>{
    //activeForms means published forms only : status = Active
    return RequestService.httpGETRequest(`${API.FORM}?activeForms=true`);
  };
  export const getFormProcesses = (formId, ...rest) => {
    const done = rest.length ? rest[0] : () => {};
    return (dispatch) => {
      RequestService.httpGETRequest(
        `${API.FORM_PROCESSES}/${formId}`,
        {},
        StorageService.get(StorageService.User.AUTH_TOKEN),
        true
      )
        .then((res) => {
          if (res) {
            console.log(res,"rers");
        }})
        // eslint-disable-next-line no-unused-vars
        .catch((error) => {
         // dispatch(setProcessStatusLoading(false));
          console.log(error);
        });
    };
  };  