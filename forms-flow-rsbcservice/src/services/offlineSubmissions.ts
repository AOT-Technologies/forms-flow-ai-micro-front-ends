import { RequestService, KeycloakService } from "@formsflow/service";
import { API_URL, WEB_BASE_URL } from "../endpoints/config";
import {
  OfflineDeleteService,
  OfflineFetchService,
} from "../formsflow-rsbcservices";
import { OfflineSubmission } from "../storage/ffDb";
import {
  FormData,
  FormioCreateResponse,
  RequestCreateFormat,
} from "./offlineSubmissions.interface";

class OfflineSubmissions {
  /**
   * Process offline submissions by fetching, processing drafts and submissions,
   * and deleting local submissions after the processes complete.
   */
  public static async processOfflineSubmissions(): Promise<void> {
    try {
      // Call token refresh.
      KeycloakService.retryTokenRefresh();
      // Fetch all non-active offline submissions
      const submissions =
        await OfflineFetchService.fetchAllNonActiveOfflineSubmissions();

      // Process drafts and submissions concurrently using Promise.all
      const processDraftsPromise = this.processDrafts(submissions);
      const processSubmissionPromise = this.processSubmission(submissions);

      // Wait for both processes to finish
      await Promise.all([processDraftsPromise, processSubmissionPromise]);
    } catch (error) {
      console.error("Error processing drafts or submissions:", error);
    }
  }

  /**
   * Process the drafts from submissions.
   * @param submissions list of submissions that need to be processed.
   */
  private static async processDrafts(
    submissions: OfflineSubmission[]
  ): Promise<void> {
    const draftSubmissions = submissions.filter(
      (submission) => submission.type === "draft"
    );
    draftSubmissions.forEach(async (draft) => {
      if (
        draft.localDraftId &&
        draft.serverDraftId &&
        draft.serverApplicationId
      ) {
        // When localDraftId is present if both serverDraftId, serverApplicationId
        // then draft submission need to updated.
        await this.prepareAndUpdateDraft(draft);
      }
      if (
        draft.localDraftId &&
        !draft.serverDraftId &&
        !draft.serverApplicationId
      ) {
        // When localDraftId is present without serverDraftId, serverApplicationId
        //then a new draft submission is created.
        await this.prepareAndSubmitDraft(draft);
      }
    });
  }

  /**
   * Prepare and submit a new draft.
   * @param draft draft submissions that need to be submitted in DB.
   */
  private static async prepareAndSubmitDraft(
    draft: OfflineSubmission
  ): Promise<void> {
    const url = `${WEB_BASE_URL}/draft`;
    const payload = {
      data: draft.data,
      formId: draft.formId,
    };
    await RequestService.httpPOSTRequest(url, payload);
    await this.deleteLocalSubmissions(draft);
  }

  /**
   * Prepare and update an existing draft.
   * @param draft draft submissions that need to be updated in DB.
   */
  private static async prepareAndUpdateDraft(
    draft: OfflineSubmission
  ): Promise<void> {
    const url = `${WEB_BASE_URL}/draft/${draft.serverDraftId}`;
    const payload = {
      data: draft.data,
      formId: draft.formId,
    };
    await RequestService.httpPUTRequest(url, payload);
    await this.deleteLocalSubmissions(draft);
  }

  /**
   * Process the submissions.
   * @param submissions list of offline submissions that need to be processed.
   */
  private static async processSubmission(
    submissions: OfflineSubmission[]
  ): Promise<void> {
    const submittedData = submissions.filter(
      (submission) => submission.type === "application"
    );
    submittedData.forEach(async (data) => {
      if (
        (data.localDraftId || data.localSubmissionId) &&
        data.serverDraftId &&
        data.serverApplicationId
      ) {
        // When localDraftId is present if both serverDraftId, serverApplicationId
        // then the data need to updated.
        await this.prepareAndUpdateSubmission(data);
      }
      if (
        (data.localDraftId || data.localSubmissionId) &&
        !data.serverDraftId &&
        !data.serverApplicationId
      ) {
        // When localDraftId is present without serverDraftId, serverApplicationId
        //then a the data need to be created as a new submission.
        await this.prepareAndSubmitSubmission(data);
      }
    });
  }

  /**
   * Prepare and submit a new submission.
   * @param data submission need to be submitted in DB
   */
  private static async prepareAndSubmitSubmission(
    data: OfflineSubmission
  ): Promise<void> {
    try {
      const response: FormioCreateResponse =
        await this.prepareAndSubmitFormioSubmission(data);
      await this.triggerApplicationCreate(response);
      await this.deleteLocalSubmissions(data);
    } catch (error) {
      console.error("Error creating the submission:", error);
    }
  }

  /**
   * Prepare and submit formio submission.
   * @param data submission need to be submitted in DB
   */
  private static async prepareAndSubmitFormioSubmission(
    data: OfflineSubmission
  ): Promise<any> {
    try {
      const formioUrl = `${API_URL}/form/${data.formId}/submission`;
      const formioPayload = {
        data: data.data,
        metadata: data.submissionData?.metadata,
        state: data.submissionData?.state,
        _vnote: data.submissionData?._vnote,
      };
      const header = { "x-jwt-token": localStorage.getItem("formioToken") };
      return RequestService.httpPOSTRequest(
        formioUrl,
        formioPayload,
        null,
        false,
        header
      );
    } catch (error) {
      console.error("Error creating the formio submission:", error);
    }
  }

  /**
   * Function which will trigger the "application/create" API.
   * @param data, data that need to processed to pass to the API.
   */
  private static async triggerApplicationCreate(
    data: FormioCreateResponse
  ): Promise<void> {
    try {
      // Process and transform the data.
      const submissionData = this.prepareApplicationPayload(data);
      // API URL
      const URL = `${WEB_BASE_URL}/application/create`;
      // Calling the API
      await RequestService.httpPOSTRequest(URL, submissionData);
    } catch (error) {
      console.error("Error creating the submission:", error);
    }
  }

  /**
   * Function to prepare appliaction payload.
   * @param data, data that need to processed to pass to the API.
   */
  private static prepareApplicationPayload(
    data: FormioCreateResponse
  ): RequestCreateFormat {
    // Get the origin.
    const origin = `${window.location.origin}/`;
    // Process and transform the data.
    return this.getProcessReq(
      { _id: data?.data?.form },
      data?.data?._id,
      origin,
      data?.data?.data
    );
  }

  /**
   * Prepare and update an existing submission.
   * @param data submission need to be updated in DB
   */
  private static async prepareAndUpdateSubmission(
    data: OfflineSubmission
  ): Promise<void> {
    try {
      const response: FormioCreateResponse =
        await this.prepareAndSubmitFormioSubmission(data);
      await this.triggerApplicationUpdate(response, data?.serverDraftId);
      await this.deleteLocalSubmissions(data);
    } catch (error) {
      console.error("Error creating and updating the submission:", error);
    }
  }

  /**
   * Function which will trigger the "draft/<drat_id>/submit" update API.
   * @param data, data that need to processed to pass to the API.
   * @param draft_id , server draft id, which need to be updated.
   */
  private static async triggerApplicationUpdate(
    data: FormioCreateResponse,
    draft_id: number | string
  ): Promise<void> {
    try {
      // Process and transform the data.
      const submissionData = this.prepareApplicationPayload(data);
      // API URL
      const URL = `${WEB_BASE_URL}/draft/${draft_id}/submit`;
      // Calling the API
      await RequestService.httpPUTRequest(URL, submissionData);
    } catch (error) {
      console.error("Error creating the submission:", error);
    }
  }

  /**
   * Delete local submissions after processing.
   * @param submissions offline submissions that need to be deleted after the process.
   */
  private static async deleteLocalSubmissions(
    submission: OfflineSubmission
  ): Promise<void> {
    await OfflineDeleteService.deleteOfflineSubmission(submission._id);
    await OfflineDeleteService.deleteApplicationWithLocalSubmissionId(
      submission.localSubmissionId
    );
  }

  /**
   * Function to form formio submission url.
   * @param formId, form id.
   * @param submissionId , submission id.
   * @returns formio submission url.
   */
  private static getFormUrlWithFormIdSubmissionId(
    formId: string | number,
    submissionId: string | number
  ): string {
    return `${WEB_BASE_URL}/form/${formId}/submission/${submissionId}`;
  }

  /**
   * Function to prepare the payload for submission create and update
   * from the formio create response.
   * @param form, object with formId.
   * @param submissionId, submission id.
   * @param origin, origin of the current URL.
   * @param submissionData, submission data.
   * @returns the prepared payload for the create or update.
   */
  private static getProcessReq(
    form: { _id: string | number },
    submissionId: string | number,
    origin: string,
    submissionData: FormData
  ): RequestCreateFormat {
    const requestFormat: RequestCreateFormat = {
      formId: form._id,
      submissionId: submissionId,
      formUrl: this.getFormUrlWithFormIdSubmissionId(form._id, submissionId),
      webFormUrl: `${origin}form/${form._id}/submission/${submissionId}`,
      data: submissionData,
    };
    return requestFormat;
  }
}
export default OfflineSubmissions;
