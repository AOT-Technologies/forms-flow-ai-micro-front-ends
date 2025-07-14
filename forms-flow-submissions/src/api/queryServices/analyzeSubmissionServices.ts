import API from "../endpoints";
import { StorageService, RequestService } from "@formsflow/service";
import { SubmissionListResponse } from "../../types/submissions";


export const getSubmissionList = (
  limit = 10,
  pageNo = 1,
  sortOrder = "asc",
  sortBy = "formName"
): Promise<SubmissionListResponse> => {
  const query = `
    query MyQuery {
      getSubmission(limit: ${limit}, pageNo: ${pageNo}, sortOrder: "${sortOrder}", sortBy: "${sortBy}") {
        submissions {
          applicationStatus
          createdBy
          data
          formName
          id
          submissionId
          created
        }
        totalCount
        pageNo     
        limit
      }
    }
  `;

  const payload = { query };
  const token = StorageService.get("AUTH_TOKEN");
    return RequestService.httpPOSTRequest(
    API.GRAPHQL_API,
    payload,
    token,
    true,
  ).then((response) => {
    const result = response.data?.data?.getSubmission;
    return result;
  });
};

export const fetchAllForms = () => {
  //activeForms means published forms only : status = Active
  return RequestService.httpGETRequest(`${API.FORM}?activeForms=true`);
};

export const fetchFormVariables = (formId) => {
  let url = `${API.FORM_PROCESSES}/${formId}`;
  return RequestService.httpGETRequest(url);
};
