import { StorageService } from "@formsflow/service";
import { IndividualFormDefinition } from "../storage/ffDb";

class DBServiceHelper {
    
    /**
     * Generates a unique identifier (UUID).
     * @returns {string} - A new UUID.
     */
    private static generateGUID(): string {
        return crypto.randomUUID();
    }

    /**
     * Retrieves user details from storage.
     * @returns {any} - Parsed user details.
     */
    private static getUserDetails(): any {
        return JSON.parse(StorageService.get(StorageService.User.USER_DETAILS));
    }

    /**
     * Constructs a submission data object.
     * @param {any} submission - The submission data.
     * @returns {object} - The constructed submission data object.
     */
    private static constructSubmissionDataObject(submission: any): any {
        const userDetails = this.getUserDetails();
        return {
            metadata: submission?.metadata,
            owner: userDetails?.email,
            externalIds: [],
            roles: [],
            access: []
        };
    }

    /**
     * Constructs offline submission data.
     * @param {any} submission - The submission data.
     * @param {string} formId - The form ID.
     * @returns {object} - The constructed offline submission data.
     */
    public static constructOfflineSubmissionData(submission: any, formId: string): any {
        const submissionData = this.constructSubmissionDataObject(submission);
        const _id = this.generateGUID();
        const submissionId = this.generateGUID();
        const now = new Date().toISOString();
        return {
            _id,
            localSubmissionId: submissionId,
            submissionData,
            draftData: {},
            created: now,
            modified: now,
            data: submission?.data,
            formId,
            type: "application"
        };
    }

    /**
     * Constructs application data.
     * @param {string} formId - The form ID.
     * @param {string} submissionId - The submission ID.
     * @param {any} formData - The form data.
     * @returns {object} - The constructed application data.
     */
    public static constructApplicationData(formId: string, submissionId: string, formData: any): any {
        const userDetails = this.getUserDetails();
        const randomId = Math.floor(Math.random() * 1000000000);
        const now = new Date().toISOString();
        const applicationName = formData?.form?.title;

        return {
            applicationName: applicationName,
            applicationStatus: "In Progress",
            created: now,
            createdBy: userDetails?.preferred_username || "Unknown User",
            eventName: null,
            formId,
            formProcessMapperId: null,
            formType: "form",
            id: randomId,
            isClientEdit: false,
            isResubmit: false,
            modified: now,
            modifiedBy: null,
            processInstanceId: null,
            processKey: null,
            processName: null,
            processTenent: null,
            submissionId
        };
    }

    /**
     * Transforms submission data.
     * @param {any} submission - The submission data.
     * @returns {object | null} - Transformed submission data or null on error.
     */
    private static transformSubmissionData(submission: any): any | null {
        try {
            if (!submission || typeof submission !== "object") {
                throw new Error("Invalid submission object");
            }
            const submissionData = submission.submissionData || {};
            return {
                access: Array.isArray(submissionData.access) ? submissionData.access : [],
                owner: submissionData.owner || "",
                externalIds: Array.isArray(submissionData.externalIds) ? submissionData.externalIds : [],
                roles: Array.isArray(submissionData.roles) ? submissionData.roles : [],
                metadata: typeof submissionData.metadata === "object" && submissionData.metadata !== null ? submissionData.metadata : {},
                form: submission.formId || "",
                created: submission.created || "",
                modified: submission.modified || "",
                data: submission.data || {},
                _id: submission.localSubmissionId || "",
            };
        } catch (error) {
            console.error("Error in transformSubmissionData:", error);
            return null;
        }
    }

    /**
     * Transforms final submission data.
     * @param {any} submission - The submission data.
     * @returns {object | null} - Transformed final submission data or null on error.
     */
    public static transformFinalSubmissionData(submission: any): any | null {
        try {
            if (!submission || typeof submission !== "object") {
                throw new Error("Invalid submission object");
            }
            const submissionData = this.transformSubmissionData(submission);
            return {
                submission: submissionData,
                formId: submission.formId || "",
                id: submission.localSubmissionId || "",
                url: "",
                lastUpdated: 0,
                isActive: false,
                error: ""
            };
        } catch (error) {
            console.error("Error in transformFinalSubmissionData:", error);
            return null;
        }
    }

    /**
     * Transforms form definition data.
     * @param {any} form - The form data.
     * @returns {object | null} - Transformed form definition data or null on error.
     */
    public static transformFormDefinitionData(form: any): any | null {
        try {
            if (!form || typeof form !== "object") {
                throw new Error("Invalid form object");
            }
            return {
                form,
                id: form._id || "",
                url: "",
                lastUpdated: 0,
                isActive: false,
                error: ""
            };
        } catch (error) {
            console.error("Error in transformFormDefinitionData:", error);
            return null;
        }
    }

    /**
   * Transforms raw form definitions into the required format.
   */
  public static transformFormDefinitions(
    forms: IndividualFormDefinition[],
    totalCount: number
  ): {
    forms: {
      description: string;
      formId: string;
      formName: string;
      formType: string;
      id: string;
      modified: string;
      processKey: string;
    }[];
    limit: number;
    pageNo: number;
    totalCount: number;
  } {
    const transformedForms = forms.map((form, index) => ({
      description: form.title || "No Description",
      formId: form._id,
      formName: form.name,
      formType: form.type,
      id: (index + 1).toString(),
      modified: form.modified,
      processKey: "Defaultflow",
    }));

    return {
      forms: transformedForms,
      limit: 5,
      pageNo: 1,
      totalCount: totalCount,
    };
  }
}

export default DBServiceHelper;
