import Dexie, { Table } from "dexie";

// Below are formsflow.ai specific interfaces
// These define the structure of various objects stored in IndexedDB
export interface ApplicationMetaData {
  owner: string;
  access: any[];
  externalIds: any[];
  roles: any[];
  metadata: Record<string, any>;
  form: string;
  created: string;
  modified: string;
  data: Record<string, any>;
  _id: string;
}

interface FormAccess {
  type: string;
  roles: string[]; // Array of role IDs
}

export interface IndividualFormDefinition {
  _id: string;
  title: string;
  description: string;
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

export interface Application {
  id: number;
  applicationName: string;
  applicationStatus: string;
  created: string;
  createdBy: string;
  eventName: string;
  formId: string;
  formProcessMapperId: string;
  formType: string;
  isClientEdit: boolean;
  isResubmit: boolean;
  modified: string;
  modifiedBy: string;
  processInstanceId: string;
  processKey: string;
  processName: string;
  processTenant: string;
  submissionId: string;
}

export interface Draft {
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

export interface DeletedDraft {
  serverDraftId: number;
}

interface DraftData {
  CreatedBy?: string;
  DraftName?: string;
  localApplicationId?: number;
  formType?: string;
  processKey?: string;
  processName?: string;
}

export interface SubmissionData {
  owner?: string;
  access?: any[];
  externalIds?: any[];
  roles?: any[];
  metadata?: Record<string, any>;
  state?: string;
  _vnote?: string;
}

// brought localDraftId and localSubmissionId here because,
// Dexie does not allow indexes on nested properties like submissionData.localSubmissionId
export interface OfflineSubmission {
  _id: string;
  formId: string;
  data: Record<string, any>;
  localDraftId?: number;
  serverDraftId?: number;
  serverApplicationId?: number;
  draftData?: DraftData;
  submissionData?: SubmissionData;
  localSubmissionId?: string;
  created: string;
  modified: string;
  type: string;
}

export interface ActiveForm {
  localDraftId?: number;
  serverDraftId?: number;
}

interface TaskVariable {
  key: string;
  label: string;
  type: string;
}

export interface FormProcess {
  anonymous: boolean;
  canBundle: boolean;
  comments?: Record<string, any>;
  created: string;
  createdBy: string;
  deleted: boolean;
  description: string;
  formId: string;
  formName: string;
  formType: string;
  id: string;
  isBundle: boolean;
  isMigrated: boolean;
  majorVersion: number;
  minorVersion: number;
  modified: string;
  modifiedBy?: string;
  parentFormId: string;
  processKey: string;
  processName: string;
  processTenant?: string;
  promptNewVersion: boolean;
  status: string;
  taskVariables: TaskVariable[];
  version: string;
}

// Database class extending Dexie to manage IndexedDB storage
class FormsFlowDB extends Dexie {
  // Declaring tables with their respective interfaces
  applications!: Table<Application>;
  offlineSubmissions!: Table<OfflineSubmission>;
  formDefinitions!: Table<IndividualFormDefinition>;
  activeForm!: Table<ActiveForm>;
  formProcesses!: Table<FormProcess>;
  deletedDrafts!: Table<DeletedDraft>;

  constructor() {
    super("formsflowTables");

    // Database schema definitions
    //if you need to change any of these definitions add a new version below instead of changing the current one. If there is a change that
    //requires a migration you need to add a .upgrade(() => {}) to the end of the version to handle how the data is migrated.

    this.version(1).stores({
      applications: "id, modified, formId, submissionId",
      offlineSubmissions:
        "_id, formId, localSubmissionId, localDraftId, type, modified, serverDraftId",
      formDefinitions:
        "_id, title, description, name, path, type, created, modified, machineName, parentFormId",
      activeForm: "localDraftId, serverDraftId",
      formProcesses: "formId, formName",
      deletedDrafts: "serverDraftId"
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
