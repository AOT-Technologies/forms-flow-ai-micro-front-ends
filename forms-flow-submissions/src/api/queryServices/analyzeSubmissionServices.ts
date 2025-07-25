import API from "../../api/endpoints";
import { StorageService, RequestService, HelperServices } from "@formsflow/service";
import { SubmissionListResponse } from "../../types/submissions";


export const getSubmissionList = (
  limit = 10,
  pageNo = 1,
  sortOrder = "asc",
  sortBy = "formName",
  dateRange = { startDate: null, endDate: null }
): Promise<SubmissionListResponse> => {
 const createdAfter = dateRange.startDate
    ? `, createdAfter: "${HelperServices.getISODateTime(dateRange.startDate)}"`
    : "";

  const createdBefore = dateRange.endDate
    ? `, createdBefore: "${HelperServices.getISODateTime(dateRange.endDate)}"`
    : "";
  const query = `
    query MyQuery {
      getSubmission(
        limit: ${limit},
        pageNo: ${pageNo},
        sortOrder: "${sortOrder}",
        sortBy: "${sortBy}"${createdAfter}${createdBefore}
      )  {
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
