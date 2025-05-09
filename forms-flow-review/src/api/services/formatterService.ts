import { AppConfig } from "../config";

export const getFormIdSubmissionIdFromURL = (formUrl) => {
  let formId, submissionId;
  if (formUrl) {
    let formString = "/form/";
    let submissionString = "/submission/";
    let firstPositionOfString = formUrl.indexOf("/form/");
    let lastPositionOfString = formUrl.indexOf("/submission");
    formId = formUrl.substring(
      firstPositionOfString + formString.length,
      lastPositionOfString
    );
    let firstPositionOfSubmissionString =
      formUrl.indexOf(submissionString) + submissionString.length;
    submissionId = formUrl.substring(firstPositionOfSubmissionString);
  }
  return { formId, submissionId };
};

export const getFormUrlWithFormIdSubmissionId = (formId, submissionId) => {
  return `${AppConfig.projectUrl}/form/${formId}/submission/${submissionId}`;
};

export const taskDetailVariableDataFormatter = (taskVariableData) => {
  const res = {};
  for (let variable in taskVariableData) {
    res[variable] = taskVariableData[variable].value;
  }
  return res;
};
