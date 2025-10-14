import { RequestService, StorageService } from "@formsflow/service";
import API from "../api/endpoints";
import { replaceUrl } from "../helper/helper";
import {
    setApplicationDetail,
    setCustomSubmission,
    setApplicationHistoryList,
    setUpdateHistoryLoader,
    serviceActionError,
    setApplicationDetailLoading
} from "../actions/applicationActions";

// -------------------- getApplicationById --------------------
export const getApplicationById = (applicationId, ...rest) => {
    const done = rest.length ? rest[0] : () => { };
    const apiUrl = replaceUrl(API.GET_APPLICATION, "<application_id>", applicationId);

    return (dispatch) => {
        RequestService.httpGETRequest(apiUrl)
            .then((res) => {
                const application = res.data?.application || res.data;
                if (application && Object.keys(application).length) {
                    dispatch(setApplicationDetail(application));
                    done(null, application);
                } else {
                    dispatch(setApplicationDetail({}));
                    done("No application data found");
                }
            })
            .catch((error) => {
                console.error("Error fetching application details:", error);
                dispatch(setApplicationDetail({}));
                done(error);
            })
            .finally(() => {
                dispatch(setApplicationDetailLoading(false));
            });
    };
};

// -------------------- fetchFormById --------------------
export const fetchFormById = (id) => {
    const formioToken = localStorage.getItem("formioToken") ?? {};
    let token = formioToken;
    return RequestService.httpGETRequest(`${API.GET_FORM_BY_ID}/${id}`, {}, "", false, {
        ...token
    });
};

// -------------------- getCustomSubmission --------------------
export const getCustomSubmission = (submissionId, formId, ...rest) => {
    const done = rest.length ? rest[0] : () => { };
    const url = `${replaceUrl(API.CUSTOM_SUBMISSION, "<form_id>", formId)}/${submissionId}`;

    return (dispatch) => {
        RequestService.httpGETRequest(url, {})
            .then((res) => {
                dispatch(setCustomSubmission(res.data ?? {}));
                done(null, res.data ?? {});
            })
            .catch((err) => {
                done(err, null);
            });
    };
};

// -------------------- getRoles --------------------
export const getRoles = () => {
    const roles = JSON.parse(StorageService.get(StorageService.User.USER_ROLE) ?? "[]");

    return {
        viewSubmissionHistory: roles.includes("submission_view_history"),
        analyze_submissions_view_history: roles.includes("analyze_submissions_view_history"),
        analyze_process_view: roles.includes("analyze_process_view"),
        // add more as needed
    };
};

// -------------------- fetchApplicationAuditHistoryList --------------------
export const fetchApplicationAuditHistoryList = (applicationId, ...rest) => {
    const done = rest.length ? rest[0] : () => { };
    const apiUrl = replaceUrl(API.GET_APPLICATION_HISTORY_API, "<application_id>", applicationId);

    return (dispatch) => {
        dispatch(setUpdateHistoryLoader(true));

        RequestService.httpGETRequest(
            apiUrl,
            {},
            StorageService.get(StorageService.User.AUTH_TOKEN),
            true
        )
            .then((res) => {
                const applications = res.data?.applications ?? [];
                dispatch(setApplicationHistoryList(applications));
                done(null, res.data);
            })
            .catch((error) => {
                dispatch(serviceActionError(error));
                done(error);
            })
            .finally(() => {
                dispatch(setUpdateHistoryLoader(false));
            });
    };
};
