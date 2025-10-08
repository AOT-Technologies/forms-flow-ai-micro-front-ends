import API from "../../api/endpoints";
import { StorageService, RequestService, HelperServices } from "@formsflow/service";
import { SubmissionListResponse } from "../../types/submissions";
import { replaceUrl} from "../../helper/helper"


export const getSubmissionList = (
  limit = 10,
  pageNo = 1,
  sortOrder = "asc",
  sortBy = "formName",
  dateRange = { startDate: null, endDate: null },
  parentFormId?: string,
  filters: Record<string, any> = {},
  selectedFormFields: string[] = []
): Promise<SubmissionListResponse> => {
  const systemFields = ["id", "form_name", "created_by", "created", "application_status"];
const formatValue = (value: any): string => {
  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`;
  }
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(", ")}]`;
  }
  if (typeof value === "object") {
    return `{ ${Object.entries(value)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(", ")} }`;
  }
  return `"${value}"`; // string by default
};

const normalizeValue = (value: any): any => {
  if (typeof value !== "string") return value;

  // number check
  if (!isNaN(value as any) && value.trim() !== "") {
    return Number(value);
  }

  // boolean check
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;

  // null/undefined
  if (value.toLowerCase() === "null") return null;

  return value; // keep as string
};


 const filtersString = Object.entries(filters)
  .filter(([key, value]) =>
    value !== undefined &&
    value !== "" &&
    (systemFields.includes(key) || selectedFormFields.includes(key))
  )
  .map(([key, value]) => {
    const normalized = normalizeValue(value);
    return `${key}: ${formatValue(normalized)}`;
  })
  .join(", ");

  const createdAfter = dateRange.startDate
    ? `createdAfter: "${HelperServices.getISODateTime(dateRange.startDate)}"`
    : "";

  const createdBefore = dateRange.endDate
    ? `createdBefore: "${HelperServices.getISODateTime(dateRange.endDate)}"`
    : "";

  const parentFormIdStr = parentFormId ? `parentFormId: "${parentFormId}"` : "";

  const selectedFieldsStr = (() => {
  if (!selectedFormFields.length) return "";

  const fieldsArray = selectedFormFields.map((f) => `"${f}"`);
  const fieldsJoined = fieldsArray.join(", ");
  return "selectedFormFields: [" + fieldsJoined + "]";
})();


  const filtersStr = filtersString ? `filters: { ${filtersString} }` : "";

  const queryArgs = [
    `limit: ${limit}`,
    `pageNo: ${pageNo}`,
    `sortOrder: "${sortOrder}"`,
    `sortBy: "${sortBy}"`,
    createdAfter,
    createdBefore,
    parentFormIdStr,
        filtersStr,

    selectedFieldsStr,
  ]
    .filter(Boolean)
    .join(",\n      ");

  const query = `
    query MyQuery {
      getSubmission(
        ${queryArgs}
      ) {
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
    true
  ).then((response) => {
    const result = response.data?.data?.getSubmission;
    return result;
  });
};



export const fetchAllForms = () => {
  //activeForms means published forms only : status = Active
  return RequestService.httpGETRequest(`${API.FORM}?allForms=true`);
};

export const fetchFormVariables = (formId) => {
  let url = `${API.FORM_PROCESSES}/${formId}`;
  return RequestService.httpGETRequest(url);
}; 

//for bundling
export const executeRule = (submissionData, mapperId) => { 
  const url = replaceUrl(API.BUNDLE_EXECUTE_RULE,"<mapper_id>", mapperId);
  return RequestService.httpPOSTRequest(url, submissionData);
};

export const getBundleCustomSubmissionData = (bundleId, submissionId, selectedFormId) =>{
  const submissionUrl = replaceUrl(API.CUSTOM_SUBMISSION, "<form_id>", bundleId);
  return  RequestService.
  httpGETRequest(`${submissionUrl}/${submissionId}?formId=${selectedFormId}`, {});
};

export const fetchBundleSubmissionData = (bundleId,submissionId,formId) => {
  let formioToken = sessionStorage.getItem("formioToken");
  let token = formioToken ? { "x-jwt-token": formioToken } : {};
  return RequestService.httpGETRequest(`${API.GET_FORM_BY_ID}/${bundleId}/submission/${submissionId}?formId=${formId}`, {}, "", false, {
    ...token
  });

};

export const fetchFormById = (id) => {
  let formioToken = sessionStorage.getItem("formioToken");
  let token = formioToken ? { "x-jwt-token": formioToken } : {};
  return RequestService.httpGETRequest(
    `${API.GET_FORM_BY_ID}/${id}`,
    {},
    "",
    false,
    {
      ...token,
    }
  );
};

export const fetchSubmissionList = () => {
  return RequestService.httpGETRequest(`${API.SUBMISSION_FILTER}`);
}
export const createOrUpdateSubmissionFilter = (data) => {
  let url = `${API.SUBMISSION_FILTER}`;
  return RequestService.httpPOSTRequest(url, data);
}

export const updateDefaultSubmissionFilter = (data) => {
  let url = `${API.UPDATE_DEFAULT_FILTER}`;
  return RequestService.httpPOSTRequest(url, data);
}


