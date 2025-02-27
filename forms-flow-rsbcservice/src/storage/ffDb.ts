import Dexie, { Table } from "dexie";

// Below are formsflow.ai specific interfaces
// These define the structure of various objects stored in IndexedDB

interface FormAccess {
  type: string;
  roles: string[]; // Array of role IDs
}

export interface IndividualFormDefinition {
  _id: string;
  title: string;
  name: string;
  path: string;
  type: string;
  display: string;
  tags: string[];
  isBundle: boolean;
  access: FormAccess[];
  submissionAccess: FormAccess[];
  owner: string;
  components: Record<string, any>[];
  created: string;
  modified: string;
  machineName: string;
  parentFormId: string;
}

interface FormDefinisionList {
  id: string;
  formId: string;
  formName: string;
  formType: string;
  processKey: string;
  modified: string;

}

interface FormListMetaData {
  key: string;
  totalCount: number;
  pageNo: number;
  limit: number; 

}

interface Application {
  id: number;
  applicationName: string;
  applicationStatus: string;
  created: string;
  createdBy: string;
  eventName: string;
  formId: string;
  formProcessMapperId: string;
  formType: string;
  isResubmit: boolean;
  modified: string;
  modifiedBy: string;
  processInstanceId: string;
  processKey: string;
  processName: string;
  processTenant: string;
  submissionId: string;
}

interface ApplicationMetaData {
  key: string;
  draftCount: number;
  totalCount: number;
  pageNo: number;
  limit: number; 

}

interface Draft {
  id: number;
  applicationId: number;
  formId: string;
  DraftName: string;
  created: string;
  modified: string;
  data: Record<string, any>; // Since the structure varies, we use a generic key-value object
  CreatedBy: string;
  processName: string;
  formType: string;
}

interface DraftMetaData {
  key: string;
  totalCount: number;
  applicationCount: number;
}

interface DraftData {
  CreatedBy: string;
  DraftName: string;
  localApplicationId: string;
  serverDraftId: string; // can be removed if not needed
  serverApplicationId: string; // can be removed if not needed
  formType: string;
  processKey: string;
  processName: string;
}

interface SubmissionData {
  owner: string;
  access: any[];
  externalIds: any[];
  roles: any[];
  metadata: Record<string, any>;

}

// brought localDraftId and localSubmissionId here because,
// Dexie does not allow indexes on nested properties like submissionData.localSubmissionId 
interface OfflineSubmission {
  _id: string;
  formId: string;
  data: Record<string, any>;
  localDraftId?: string;
  draftData: DraftData;
  submissionData: SubmissionData;
  localSubmissionId?: string;
  created: string;
  modified: string;
  type: string;
}

// Database class extending Dexie to manage IndexedDB storage
class FormsFlowDB extends Dexie {
  // Declaring tables with their respective interfaces
  formDefinitionList!: Table<FormDefinisionList>;
  formListMetaData!: Table<FormListMetaData>;
  applications!: Table<Application>;
  applicationMetaData!: Table<ApplicationMetaData>;
  drafts!: Table<Draft>;
  draftMetaData!: Table<DraftMetaData>;
  offlineSubmissions!: Table<OfflineSubmission>;
  formDefinitions!: Table<IndividualFormDefinition>;

  constructor() {
    super("formsflowTables");

    // Database schema definitions
    //if you need to change any of these definitions add a new version below instead of changing the current one. If there is a change that
    //requires a migration you need to add a .upgrade(() => {}) to the end of the version to handle how the data is migrated.

    this.version(1).stores({
      formDefinitionList: "id, formId, formName, formType, processKey, modified",
      formListMetaData: "key",
      applications: "id, formId, submissionId",
      applicationMetaData: "key",
      drafts: "id, applicationId, formId",
      draftMetaData:"key",
      offlineSubmissions: "_id, formId, localSubmissionId, localDraftId, type",
      formDefinitions: "_id, title, name, path, type, created, modified, machineName, parentFormId"

    });
  }
}

// Initialize the database
export const ffDb = new FormsFlowDB();

// Open the database and clear formID for testing
const initDB = async () => {
  try {
    if (!ffDb.isOpen()) {
      await ffDb.open();
      console.log("IndexedDB is open.");
    } else {
      console.log("IndexedDB is already open.");
    }
  } catch (error) {
    console.error("Open failed: " + error);
  }
};

initDB();
