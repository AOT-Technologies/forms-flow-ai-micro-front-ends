import { StorageService } from "@formsflow/service";
import { IndividualFormDefinition, OfflineSubmission, SubmissionData, Application, ApplicationMetaData, Draft } from "../storage/ffDb";

class DBServiceHelper {
    
    /**
     * Generates a unique identifier (UUID).
     * @returns {string} - A new UUID.
     */
    private static generateGUID(): string {
        return crypto.randomUUID();
    }

    /**
     * Generates a unique number.
     * @returns {number} - A new random number.
     */
    private static generateRandomNumber(): number {
        return crypto.getRandomValues(new Uint32Array(1))[0];;
    }
    /**
     * Retrieves user details from storage.
     * @returns {any} - Parsed user details.
     */
    public static getUserDetails(): any {
        return JSON.parse(StorageService.get(StorageService.User.USER_DETAILS));
    }
    /**
     * Retrieves authorization token from storage.
     * @returns string - authorization token.
     */
    public static getAuthorizationToken(): any {
        return StorageService.get(StorageService.User.AUTH_TOKEN);
    }
    /**
     * Constructs a submission data object.
     * @param {any} submission - The submission data.
     * @returns {object} - The constructed submission data object.
     */
    private static constructSubmissionDataObject(submission: any): SubmissionData {
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
    public static constructOfflineSubmissionData(submission: any, formId: string): OfflineSubmission {
        const submissionData = this.constructSubmissionDataObject(submission);
        const _id = this.generateGUID();
        const submissionId = this.generateGUID();
        const now = new Date().toISOString();
        return {
            _id,
            localSubmissionId: submissionId,
            submissionData,
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
    public static constructApplicationData(formId: string, submissionId: string, formData: any): Application {
        const userDetails = this.getUserDetails();
        const randomId = this.generateRandomNumber();
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
            processTenant: null,
            submissionId
        };
    }

    /**
     * Transforms submission data.
     * @param {any} submission - The submission data.
     * @returns {object | null} - Transformed submission data or null on error.
     */
    private static transformSubmissionData(submission: any): ApplicationMetaData | null {
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
     * @returns {any | null} - Transformed final submission data or null on error.
     */
    public static transformFinalSubmissionData(submission: any): {
        submission: Record<string, any>;
        formId: string;
        id: string;
        url: string;
        lastUpdated: number;
        isActive: boolean;
        error: string;
    } | null {
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
    public static transformFormDefinitionData(form: any): {
        form: Record<string, any>;
        id: string;
        url: string;
        lastUpdated: number;
        isActive: boolean;
        error: string;
    } | null {
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

    /**
         * Constructs offline draft data.
         * @param {any} draft - The draft data.
         * @returns {object} - The constructed offline submission data.
         */
    public static constructOfflineDraftData(draft: any, formId: string, formData: any): {
        inputDraft: Record<string, any>;
        res: Record<string, any>;
    } {
        const userDetails = this.getUserDetails();
        const _id = this.generateGUID();
        const localDraftId = this.generateRandomNumber();
        const CreatedBy = userDetails?.preferred_username;
        const DraftName = formData?.form?.title;
        const localApplicationId = this.generateRandomNumber();
        const serverDraftId=draft?.serverDraftId;
        const serverApplicationId="";
        const formType = formData?.form?.type || "";
        const processKey = "";
        const processName = "";
        const now = new Date().toISOString();
        const draftData = {
            CreatedBy: CreatedBy,
            DraftName: DraftName,
            localApplicationId: localApplicationId,
            serverDraftId: serverDraftId,
            serverApplicationId: serverApplicationId,
            formType: formType,
            processKey: processKey,
            processName: processName
        }
        const res = this.constructDraftResponse(localApplicationId, localDraftId, now, draft?.data, _id);
        const inputDraft = {
            _id,
            localDraftId: localDraftId,
            submissionData: {},
            draftData: draftData,
            created: now,
            modified: now,
            data: draft?.data,
            formId,
            type: "draft"
        };
        return {
            inputDraft,
            res
        }
    }

    private static constructDraftResponse(
        localApplicationId: number, 
        localDraftId: number, 
        created: string, 
        data: any, 
        _id: string): {
            applicationId: number;
            id: number;
            localDraftId: number;
            created: string;
            modified: string;
            data: Record<string, any>; 
            _id: string;
        } {
        return {
            applicationId: localApplicationId,
            id: localDraftId,
            localDraftId,
            created: created,
            modified: created,
            data: data,
            _id: _id
        }
    }

    public static tranformOfflineDrafts(drafts: OfflineSubmission[]): {
        totalCount: number;
        drafts: Draft[];
        applicationCount: number;
    } {

        const transformedDrafts = drafts.map((draft: any) => ({
            CreatedBy: draft.draftData?.CreatedBy || "Unknown",
            DraftName: draft.draftData?.DraftName || "Untitled Draft",
            applicationId: draft.draftData?.localApplicationId || null,
            created: draft.created || "",
            data: draft.data || {},
            formId: draft.formId || "",
            formType: draft.draftData?.formType || "",
            id: draft.localDraftId || "",
            modified: draft.modified || "",
            processName: draft.draftData?.processName || "",
        }));
        return {
            totalCount: drafts.length,
            drafts: transformedDrafts,
            applicationCount: drafts.length,
        };
    }

    public static constructUpdateOfflineSubmissionData(draft: any, newSubmissionData: any): any {
        // Update the required fields from newSubmissionData
        draft.data = newSubmissionData.data;
        draft.localSubmissionId = this.generateGUID();
        draft.modified = newSubmissionData.modified || new Date().toISOString();
        draft.type = "application";
        draft.created = newSubmissionData.created || draft.created; // Preserve original created date if not provided

        // Update submissionData structure
        draft.submissionData = {
            access: newSubmissionData.access || [],
            externalIds: newSubmissionData.externalIds || [],
            roles: newSubmissionData.roles || [],
            metadata: newSubmissionData.metadata || {}
        };
        return draft;
    }

    public static transformEditDraftData(draft: OfflineSubmission): any {
        return {
            CreatedBy: draft.draftData.CreatedBy,
            DraftName: draft.draftData.DraftName,
            applicationId: draft.draftData.localApplicationId,
            created: draft.created,
            data: draft.data,
            formId: draft.formId,
            formType: draft.draftData.formType,
            id: draft.localDraftId,
            localDraftId: draft.localDraftId,
            serverDraftId: draft.draftData?.serverDraftId,
            modified: draft.modified,
            processKey: draft.draftData.processKey,
            processName: draft.draftData.processName,
          };
    }
}

export default DBServiceHelper;
