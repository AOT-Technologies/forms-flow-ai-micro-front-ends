import { RequestService, KeycloakService } from "@formsflow/service";
import {
  API_URL,
  KEYCLOAK_CLIENT,
  KEYCLOAK_URL_AUTH,
  KEYCLOAK_URL_REALM,
  WEB_BASE_URL,
  FORMIO_URL
} from "../endpoints/config";
import {
  OfflineDeleteService,
  OfflineFetchService
} from "../formsflow-rsbcservices";
import { OfflineSubmission } from "../storage/ffDb";
import {
  FormData,
  FormioCreateResponse,
  RequestCreateFormat
} from "./offlineSubmissions.interface";
import PubSub from "pubsub-js";

class OfflineSubmissions {
  /**
   * Processes offline submissions by fetching them, processing drafts and submissions,
   * and deleting local submissions after the processes complete.
   * It returns the count of drafts and submissions processed.
   */
  public static async processOfflineSubmissions(): Promise<void> {
    try {
      await this.retryToken();

      const submissions =
        await OfflineFetchService.fetchAllNonActiveOfflineSubmissions();
      const processPromises = [
        this.processDrafts(submissions),
        this.processSubmission(submissions),
        this.processDraftDelete()
      ];

      // Wait for all processes to finish
      await Promise.all(processPromises);
      PubSub.publish("DRAFT_ENABLED_SYNC_COMPLETED", {
        status: "completed"
      });
    } catch (error) {
      // Log error and track failed drafts/submissions
      console.error("Error processing drafts or submissions:", error);

      // Publish the failure status with counts
      PubSub.publish("DRAFT_ENABLED_SYNC_COMPLETED", {
        status: "incompleted"
      });
    }
  }

  /**
   * Initializes Keycloak if it's not already initialized and retry token.
   */
  public static async retryToken(): Promise<void> {
    const instance = KeycloakService.getInstance(
      KEYCLOAK_URL_AUTH,
      KEYCLOAK_URL_REALM,
      KEYCLOAK_CLIENT
    );

    if (!instance.isInitialized) {
      await new Promise<void>((resolve) =>
        instance.initKeycloak((authenticated) => {
          if (!authenticated) {
            instance.retryTokenRefresh();
          }
          resolve();
        })
      );
    }
  }

  /**
   * Processes draft deletions. Fetches drafts marked for deletion and deletes them from both the server and local DB.
   */
  private static async processDraftDelete(): Promise<void> {
    const draftsToBeDeleted = await OfflineFetchService.fetchAllDraftDelete();
    const serverDraftIdList = draftsToBeDeleted.map(
      (draft) => draft.serverDraftId
    );

    await Promise.all(serverDraftIdList.map(this.deleteDrafts));
  }

  /**
   * Deletes a draft from the server and local database.
   * @param serverDraftId The ID of the draft to be deleted.
   */
  private static async deleteDrafts(serverDraftId: number): Promise<void> {
    const URL = `${WEB_BASE_URL}/draft/${serverDraftId}`;

    // Delete the draft from the server
    await RequestService.httpDELETERequest(URL);
    // Delete the corresponding local draft entry
    await OfflineDeleteService.deleteDraftDeleteWithServerId(serverDraftId);
  }

  /**
   * Processes drafts from the list of submissions.
   * - If the draft exists and has both a server draft ID and application ID, it will be updated.
   * - If the draft is new (no server IDs), it will be created.
   * @param submissions List of offline submissions to process.
   */
  private static async processDrafts(
    submissions: OfflineSubmission[]
  ): Promise<void> {
    const draftSubmissions = submissions.filter(
      (submission) => submission.type === "draft"
    );

    // Process each draft submission and update the count
    await Promise.all(
      draftSubmissions.map(async (draft) => {
        await this.handleDraftSubmission(draft);
      })
    );
  }

  /**
   * Handles the submission of drafts by checking if it needs to be created or updated.
   * @param draft The draft submission to be processed.
   */
  private static async handleDraftSubmission(
    draft: OfflineSubmission
  ): Promise<void> {
    if (
      draft.localDraftId &&
      draft.serverDraftId &&
      draft.serverApplicationId
    ) {
      // Update existing draft
      await this.prepareAndUpdateDraft(draft);
    } else if (
      draft.localDraftId &&
      !draft.serverDraftId &&
      !draft.serverApplicationId
    ) {
      // Create a new draft
      await this.prepareAndSubmitDraft(draft);
    }
  }

  /**
   * Prepares and submits a new draft.
   * @param draft The draft submission to be created.
   */
  private static async prepareAndSubmitDraft(
    draft: OfflineSubmission
  ): Promise<void> {
    const url = `${WEB_BASE_URL}/draft`;
    const payload = { data: draft.data, formId: draft.formId };

    try {
      await RequestService.httpPOSTRequest(url, payload);
      await this.deleteLocalSubmissions(draft);
    } catch (error) {
      console.error("Error creating the submission:", error);
      throw new Error("Draft submission failed");
    }
  }

  /**
   * Prepares and updates an existing draft.
   * @param draft The draft submission to be updated.
   */
  private static async prepareAndUpdateDraft(
    draft: OfflineSubmission
  ): Promise<void> {
    const url = `${WEB_BASE_URL}/draft/${draft.serverDraftId}`;
    const payload = { data: draft.data, formId: draft.formId };

    try {
      await RequestService.httpPUTRequest(url, payload);
      await this.deleteLocalSubmissions(draft);
    } catch (error) {
      console.error("Error updating the submission:", error);
      throw new Error("Draft update failed");
    }
  }

  /**
   * Processes the submission of offline applications.
   * - If the application exists and has both server draft ID and application ID, it will be updated.
   * - If the application is new (no server IDs), it will be created.
   * @param submissions List of offline submissions to process.
   */
  private static async processSubmission(
    submissions: OfflineSubmission[]
  ): Promise<void> {
    const submittedData = submissions.filter(
      (submission) => submission.type === "application"
    );

    // Process each submission and update the count
    await Promise.all(
      submittedData.map(async (data) => {
        await this.handleSubmission(data);
      })
    );
  }

  /**
   * Handles the submission of an application, checking if it needs to be created or updated.
   * @param data The application submission to be processed.
   */
  private static async handleSubmission(
    data: OfflineSubmission
  ): Promise<void> {
    if (
      (data.localDraftId || data.localSubmissionId) &&
      data.serverDraftId &&
      data.serverApplicationId
    ) {
      // Update existing submission
      await this.prepareAndUpdateSubmission(data);
    } else if (
      (data.localDraftId || data.localSubmissionId) &&
      !data.serverDraftId &&
      !data.serverApplicationId
    ) {
      // Create a new submission
      await this.prepareAndSubmitSubmission(data);
    }
  }

  /**
   * Prepares and submits a new application.
   * @param data The application submission to be created.
   */
  private static async prepareAndSubmitSubmission(
    data: OfflineSubmission
  ): Promise<void> {
    try {
      const response: FormioCreateResponse =
        await this.prepareAndSubmitFormioSubmission(data);
      await this.triggerApplicationCreate(response);
      await this.deleteLocalSubmissions(data, true);
    } catch (error) {
      console.error("Error creating the submission:", error);
      throw new Error("Submission creation failed");
    }
  }

  /**
   * Prepares and submits a Form.io submission.
   * @param data The application submission to be submitted.
   */
  private static async prepareAndSubmitFormioSubmission(
    data: OfflineSubmission
  ) {
    const formioUrl = `${API_URL}/form/${data.formId}/submission`;
    const formioPayload = {
      data: data.data,
      metadata: data.submissionData?.metadata,
      state: data.submissionData?.state,
      _vnote: data.submissionData?._vnote
    };
    const header = { "x-jwt-token": localStorage.getItem("formioToken") };

    return RequestService.httpPOSTRequest(
      formioUrl,
      formioPayload,
      null,
      false,
      header
    );
  }

  /**
   * Triggers the application creation API call after a successful submission.
   * @param data The Form.io response data for the submission.
   */
  private static async triggerApplicationCreate(
    data: FormioCreateResponse
  ): Promise<void> {
    const submissionData = this.prepareApplicationPayload(data);
    const URL = `${WEB_BASE_URL}/application/create`;

    await RequestService.httpPOSTRequest(URL, submissionData);
  }

  /**
   * Prepares the payload required for creating or updating an application.
   * @param data The Form.io response data for the submission.
   * @returns The prepared payload for the application.
   */
  private static prepareApplicationPayload(
    data: FormioCreateResponse
  ): RequestCreateFormat {
    const origin = `${window.location.origin}/`;

    return this.getProcessReq(
      { _id: data?.data?.form },
      data?.data?._id,
      origin,
      data?.data?.data
    );
  }

  /**
   * Prepares the request payload for creating or updating the application.
   * @param form The form ID.
   * @param submissionId The submission ID.
   * @param origin The origin of the request.
   * @param submissionData The submission data.
   * @returns The prepared request payload.
   */
  private static getProcessReq(
    form: { _id: string | number },
    submissionId: string | number,
    origin: string,
    submissionData: FormData
  ): RequestCreateFormat {
    return {
      formId: form._id,
      submissionId,
      formUrl: this.getFormUrlWithFormIdSubmissionId(form._id, submissionId),
      webFormUrl: `${origin}form/${form._id}/submission/${submissionId}`,
      data: submissionData
    };
  }

  /**
   * Deletes the local submission entry after processing.
   * @param submission The submission to be deleted.
   * @param deleteApplications Whether to delete the corresponding application as well.
   */
  private static async deleteLocalSubmissions(
    submission: OfflineSubmission,
    deleteApplications = false
  ): Promise<void> {
    await OfflineDeleteService.deleteOfflineSubmission(submission._id);

    if (deleteApplications) {
      await OfflineDeleteService.deleteApplicationWithLocalSubmissionId(
        submission.localSubmissionId
      );
    }
  }

  /**
   * Generates a Form.io submission URL using the form ID and submission ID.
   * @param formId The form ID.
   * @param submissionId The submission ID.
   * @returns The generated submission URL.
   */
  private static getFormUrlWithFormIdSubmissionId(
    formId: string | number,
    submissionId: string | number
  ): string {
    return `${FORMIO_URL}/form/${formId}/submission/${submissionId}`;
  }

  /**
   * Prepares and updates an existing submission.
   * @param data The submission to be updated.
   */
  private static async prepareAndUpdateSubmission(
    data: OfflineSubmission
  ): Promise<void> {
    try {
      const response: FormioCreateResponse =
        await this.prepareAndSubmitFormioSubmission(data);
      await this.triggerApplicationUpdate(response, data?.serverDraftId);
      await this.deleteLocalSubmissions(data, true);
    } catch (error) {
      console.error("Error creating and updating the submission:", error);
      throw new Error("Submission update failed");
    }
  }

  /**
   * Triggers the "draft/<draft_id>/submit" update API after the submission is updated.
   * @param data The Form.io response data for the submission.
   * @param draftId The draft ID to submit.
   */
  private static async triggerApplicationUpdate(
    data: FormioCreateResponse,
    draftId: number | string
  ): Promise<void> {
    const submissionData = this.prepareApplicationPayload(data);
    const URL = `${WEB_BASE_URL}/draft/${draftId}/submit`;

    await RequestService.httpPUTRequest(URL, submissionData);
  }

  /**
   * Checks if there are any offline submissions available.
   * @returns True if there are offline submissions, false otherwise.
   */
  public static async anyOfflineSubmissions(): Promise<boolean> {
    try {
      return await OfflineFetchService.anyOfflineSubmissions();
    } catch (error) {
      console.error("Error checking offline submissions:", error);
      return false;
    }
  }
}

export default OfflineSubmissions;
