import { rsbcDb } from "./rsbcDb";
import { DeletedDraft, ffDb, IndividualFormDefinition, OfflineSubmission } from "./ffDb";
import { StaticTables } from "../constants/constants";
import DBServiceHelper from "../helpers/helperDbServices";
import { FormTypes } from "../constants/constants";

interface TableFilter {
  column: string;
  condition: "=" | "IN" | "LIKE";
  values: string | string[];
}

interface UpdateFilter {
  conditions: Record<string, any>; // Object with search conditions
  updates: Record<string, any>; // Object with updates to make
}

class OfflineFetchService {
  /**
   * Fetches static data from a given table in IndexedDB.
   * Ensures that the table is within the predefined static tables list.
   *
   * @param tableName - Name of the table to fetch data from.
   * @param filter - Optional filter object for filtering results
   * @param filter.column - The column name to filter on
   * @param filter.condition - The condition to apply ("=" | "IN" | "LIKE")
   * @param filter.values - The value(s) to filter by. String for "=" and "LIKE", string[] for "IN"
   * @returns A promise that resolves to an array of records from the table.
   * @throws Error if IndexedDB is unavailable, the table is inaccessible, or data retrieval fails.
   */
  public static async fetchStaticDataFromTable(
    tableName: string,
    filter?: TableFilter
  ): Promise<any[]> {
    try {
      if (!rsbcDb) throw new Error("IndexedDB is not available.");
      if (!StaticTables.includes(tableName))
        throw new Error(`Table ${tableName} is not accessible.`);

      await rsbcDb.open(); // Ensure the database is open

      const table = rsbcDb[tableName];
      if (!table) {
        throw new Error(`Table ${tableName} not found in IndexedDB.`);
      }

      // Validate filter if provided
      if (filter) {
        if (!filter.column || !filter.condition) {
          throw new Error("Invalid filter: missing required properties");
        }

        if (filter.condition === "IN" && !Array.isArray(filter.values)) {
          throw new Error("Values must be an array for IN condition");
        }
      }

      let data: any[] = [];
      if (filter) {
        const { column, condition, values } = filter;

        switch (condition) {
          case "=":
            data = await table.where(column).equals(values).toArray();
            break;

          case "IN":
            data = await table
              .where(column)
              .anyOf(values as string[])
              .toArray();
            break;

          case "LIKE":
            if (typeof values !== "string") {
              throw new Error("Values must be a string for LIKE condition");
            }
            const allData = await table.toArray();
            data = allData.filter((item) => {
              const itemValue = String(item[column] || "").toLowerCase();
              const searchValue = String(values || "").toLowerCase();
              return itemValue.includes(searchValue);
            });
            break;

          default:
            throw new Error(`Unsupported condition: ${condition}`);
        }
      } else {
        data = await table.toArray();
      }

      if (!data.length) {
        console.warn(`No data found in table ${tableName}.`);
      }

      return data;
    } catch (error) {
      console.error(`Error fetching data from table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Updates data in a static table in IndexedDB.
   * Ensures that the table is within the predefined static tables list.
   *
   * @param tableName - Name of the table to update data in
   * @param filter - Filter object for updating records
   * @param filter.conditions - Object with conditions to match records (e.g., {id: 3} or {date: "1990-12-12", status: "new"})
   * @param filter.updates - Object with updates to make (e.g., {status: "completed"})
   * @returns A promise that resolves to the number of updated records
   * @throws Error if IndexedDB is unavailable, the table is inaccessible, or update fails.
   */
  public static async updateStaticDataTable(
    tableName: string,
    filter: UpdateFilter
  ): Promise<number> {
    try {
      if (!rsbcDb) {
        throw new Error("IndexedDB is not available.");
      }
      if (!StaticTables.includes(tableName)) {
        throw new Error(`Table ${tableName} is not accessible.`);
      }

      await rsbcDb.open(); // Ensure the database is open

      // Get table using Dexie's table() method
      const table = rsbcDb.table(tableName);
      if (!table) {
        throw new Error(`Table ${tableName} not found in IndexedDB.`);
      }

      // Validate filter
      if (
        !filter?.conditions ||
        !filter?.updates ||
        Object.keys(filter.conditions).length === 0 ||
        Object.keys(filter.updates).length === 0
      ) {
        throw new Error(
          "Invalid filter: conditions and updates are required and must not be empty"
        );
      }

      // Get all records first
      const allRecords = await table.toArray();

      // Filter records that match ALL conditions
      const recordsToUpdate = allRecords.filter((record) => {
        return Object.entries(filter.conditions).every(
          ([key, value]) => record[key] === value
        );
      });

      // Update each record with all specified updates
      const updatePromises = recordsToUpdate.map(async (record) => {
        // Apply all updates to the record
        Object.entries(filter.updates).forEach(([key, value]) => {
          record[key] = value;
        });
        return await table.put(record);
      });

      await Promise.all(updatePromises);
      const updateCount = recordsToUpdate.length;

      if (updateCount === 0) {
        console.warn(`No records updated in table ${tableName}.`);
      }

      return updateCount;
    } catch (error) {
      console.error(`Error updating data in table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new record in a static table in IndexedDB.
   * Ensures that the table is within the predefined static tables list.
   *
   * @param tableName - Name of the table to create data in
   * @param data - The data object to insert into the table
   * @returns A promise that resolves to the id of the created record
   * @throws Error if IndexedDB is unavailable, the table is inaccessible, or creation fails.
   */
  public static async insertStaticDataTable(
    tableName: string,
    data: any
  ): Promise<any> {
    try {
      if (!rsbcDb) {
        throw new Error("IndexedDB is not available.");
      }
      if (!StaticTables.includes(tableName)) {
        throw new Error(`Table ${tableName} is not accessible.`);
      }

      await rsbcDb.open(); // Ensure the database is open

      const table = rsbcDb.table(tableName);
      if (!table) {
        throw new Error(`Table ${tableName} not found in IndexedDB.`);
      }

      // Validate data
      if (!data || Object.keys(data).length === 0) {
        throw new Error(
          "Invalid data: data object is required and must not be empty"
        );
      }

      // Add the record to the table
      const id = await table.add(data);

      return id;
    } catch (error) {
      console.error(`Error creating data in table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Fetches the all form Ids data from the "formID" table in IndexedDB.
   */
  public static async fetchFormIdDataFromTable(): Promise<any[]> {
    const tableName = "formID";
    try {
      if (!rsbcDb) throw new Error("IndexedDB is not available.");

      await rsbcDb.open(); // Ensure the database is open

      const table = rsbcDb[tableName];
      if (!table) throw new Error(`Table ${tableName} not found in IndexedDB.`);

      const data = await table.toArray();
      if (!data.length) console.warn(`No data found in table ${tableName}.`);

      return data;
    } catch (error) {
      console.error(`Error fetching data from table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Returns the unleased form IDs for a given form type.
   * @param formType - "12Hour", "24Hour", "VI"
   */
  public static async getAvailableFormIds(formType: string): Promise<any[]> {
    try {
      if (!rsbcDb.formID) {
        throw new Error("FormID table is not available.");
      }
      if (!formType || !FormTypes.includes(formType)) {
        throw new Error(`Valid formTypes: ${FormTypes.join(", ")}`);
      }
      const unleasedForms = await rsbcDb.formID
        .where("form_type")
        .equals(formType)
        .filter((form) => form.leased === false)
        .toArray();

      return unleasedForms.map((form) => form.id);
    } catch (error) {
      console.error(`Error fetching available form IDs from IndexedDB:`, error);
      return [];
    }
  }

  /**
   * Fetches the form availability data from the "formID" table in IndexedDB.
   * @param formType - "12Hour", "24Hour", "VI"
   */
  public static async getNextAvailableFormId(
    formType: string
  ): Promise<string | null> {
    try {
      if (!rsbcDb.formID) {
        throw new Error("FormID table is not available.");
      }

      if (!formType || !FormTypes.includes(formType)) {
        throw new Error(`Valid formTypes: ${FormTypes.join(", ")}`);
      }

      const topUnleasedForm = await rsbcDb.formID
        .where("form_type")
        .equals(formType)
        .and((form) => form.leased === false)
        .sortBy("last_updated")
        .then((forms) => forms[0]);

      return topUnleasedForm ? topUnleasedForm.id : null;
    } catch (error) {
      console.error(
        `Error fetching next available form ID from IndexedDB:`,
        error
      );
      return null;
    }
  }

  /**
   * Fetches the form unleased Ids data from the "formID" table in IndexedDB.
   * @return [{"form_type": string, "count": number}]
   */
  public static async getFormAvailability(): Promise<
    { form_type: string; count: number }[]
  > {
    try {
      if (!rsbcDb.formID) {
        throw new Error("FormID table is not available.");
      }

      const unleasedForms = await rsbcDb.formID
        .filter((form) => form.leased === false)
        .toArray();

      const formTypeCounts: { [key: string]: number } = {};
      unleasedForms.forEach((form) => {
        formTypeCounts[form.form_type] =
          (formTypeCounts[form.form_type] || 0) + 1;
      });

      const result = Object.entries(formTypeCounts).map(
        ([form_type, count]) => ({
          form_type,
          count,
        })
      );

      return result;
    } catch (error) {
      console.error(`Error fetching form availability from IndexedDB:`, error);
      return [];
    }
  }

  /**
   * Generates metadata for fetched data.
   *
   * @param data - The data for which metadata is generated.
   * @returns An object containing metadata such as count and pagination details.
   */
  private static getMetadata(data: any) {
    return {
      draftCount: 0,
      totalCount: data?.length,
      pageNo: 1,
      limit: 5,
    };
  }

  /**
   * Retrieves all form definitions from IndexedDB.
   */
  private static async getOriginalFormDefinitions(): Promise<
    IndividualFormDefinition[]
  > {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }
      return await ffDb.formDefinitions.toArray();
    } catch (error) {
      console.error("Error retrieving form definitions from IndexedDB:", error);
      return [];
    }
  }

  /**
   * Fetches form definitions from IndexedDB and transforms them into the required format.
   */
  public static async fetchOfflineFormDefinitions(): Promise<{
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
  }> {
    try {
      const forms = await this.getOriginalFormDefinitions();

      // Get total count from the array length
      const totalCount = forms.length;

      // Transform and return the data
      const finalData = DBServiceHelper.transformFormDefinitions(
        forms,
        totalCount
      );
      return finalData;
    } catch (error) {
      console.error("Error fetching and transforming form definitions:", error);
      return { forms: [], limit: 5, pageNo: 1, totalCount: 0 };
    }
  }

  /**
   * Fetches a specific offline form by its ID from the formDefinition table.
   *
   * @param formId - The ID of the form to retrieve.
   * @returns A promise resolving to the form data or null if not found.
   * @throws Error if IndexedDB is unavailable or the table is missing.
   */
  public static async fetchOfflineFormById(formId: string): Promise<any> {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }
      await ffDb.open();

      // Get reference to the formDefinition table
      const table = ffDb["formDefinitions"];

      if (!table) {
        throw new Error("Table formDefinition not found in IndexedDB.");
      }

      // Fetch row by ID
      const data = await table.get(formId);
      const finalData = DBServiceHelper.transformFormDefinitionData(data);

      if (!finalData) {
        console.log(`No record found with id: ${formId}`);
        return null;
      }

      return finalData;
    } catch (error) {
      console.error(
        `Error fetching data from formDefinition with id ${formId}:`,
        error
      );
      throw error;
    }
  }

  // fetched form process by formId
  public static async fetchOfflineFormProcessById(
    formId: string
  ): Promise<any> {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }
      await ffDb.open();

      // Get reference to the formProcesses table
      const table = ffDb["formProcesses"];

      if (!table) {
        throw new Error("Table formProcesses not found in IndexedDB.");
      }

      // Fetch row by ID
      const data = await table.get(formId);

      if (!data) {
        console.log(`No record found with id: ${formId}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error(
        `Error fetching data from formProcesses with id ${formId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Fetches the list of offline submissions from the "applications" table.
   * Includes metadata for pagination or dashboard representation.
   *
   * @returns A promise resolving to an object containing submissions and metadata.
   * @throws Error if IndexedDB is unavailable or the table is missing.
   */
  public static async fetchOfflineSubmissionList(): Promise<any> {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }
      await ffDb.open();
      const table = ffDb["applications"];
      if (!table) {
        throw new Error(`Table application not found in IndexedDB.`);
      }
      const data = await table.orderBy("modified").reverse().toArray();
      if (data.length === 0) {
        console.log(`No data found in table application.`);
        return;
      }
      // Fetch Metadata for the submission dashboard
      const metadata = this.getMetadata(data);
      const finalData: Record<string, any> = {
        ["applications"]: data,
        metadata,
      };

      return finalData;
    } catch (error) {
      console.error(`Error fetching data from table application:`, error);
      throw error;
    }
  }

  /**
   * Fetches a specific offline submission by ID from the "offlineSubmission" table.
   *
   * @param submissionId - The ID of the submission to retrieve.
   * @returns A promise resolving to the submission data or null if not found.
   * @throws Error if IndexedDB is unavailable or the table is missing.
   */
  public static async fetchOfflineSubmissionById(
    submissionId: string
  ): Promise<any> {
    try {
      const submission = await this.fetchOfflineSubmissionByInputId(
        submissionId,
        "localSubmissionId"
      );
      const updatedSubmission =
        DBServiceHelper.transformFinalSubmissionData(submission);

      return updatedSubmission;
    } catch (error) {
      console.error(
        `Error fetching data from offlineSubmission with id ${submissionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Fetches offline drafts from the "offlineSubmission" table.
   *
   * @returns A promise resolving to the draft data or null if not found.
   * @throws Error if IndexedDB is unavailable or the table is missing.
   */
  public static async fetchOfflineDrafts(): Promise<any> {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }
      await ffDb.open();

      // Get reference to the formDefinition table
      const offlineSubmissions = ffDb["offlineSubmissions"];

      if (!offlineSubmissions) {
        throw new Error("Table offlineSubmission not found in IndexedDB.");
      }

      // Fetch drafts by type
      const drafts = await offlineSubmissions
        .where("type")
        .equals("draft")
        .toArray();
      drafts.sort((a, b) => (b.modified > a.modified ? 1 : -1));

      const transformedDrafts = DBServiceHelper.tranformOfflineDrafts(drafts);
      if (!transformedDrafts) {
        console.log("No draft records found.");
        return { drafts: [], applicationCount: 0, totalCount: 0 }; // totalCount = draftsCount, applicationCount=submissionCount
      }
      return transformedDrafts;
    } catch (error) {
      console.error(
        `Error fetching data from offlineSubmission with offline draft information :`,
        error
      );
      throw error;
    }
  }

  /**
   * Fetches a specific offline draft by input ID provided from the "offlineSubmission" table.
   *
   * @param inputDraftId - The ID of the offlineSubmission to retrieve.
   * @param inputDraftColumn - The Column Name of the offlineSubmission to retrieve.
   * @returns A promise resolving to the draft data or null if not found.
   * @throws Error if IndexedDB is unavailable or the table is missing.
   */
  public static async fetchOfflineSubmissionByInputId(
    inputId: string,
    inputColumn: string
  ): Promise<any> {
    if (!ffDb) {
      throw new Error("IndexedDB is not available.");
    }
    await ffDb.open();

    const offlineSubmissions = ffDb["offlineSubmissions"];

    if (!offlineSubmissions) {
      throw new Error("Table offlineSubmissions not found in IndexedDB.");
    }
    let draftId: number;
    let draft: OfflineSubmission | undefined;
    try {
      if (["localDraftId", "serverDraftId"].includes(inputColumn)) {
        draftId = Number(inputId);

        if (isNaN(draftId)) {
          console.error("Invalid draftId: Not a valid number");
          return {
            status: "error",
            message: `Invalid draftId: Not a valid number`,
          };
        }
        // Find the draft by localDraftId/serverDraftId
        draft = await offlineSubmissions
          .where(inputColumn)
          .equals(draftId)
          .first();
      } else {
        // Find the draft by localSubmissionId
        draft = await offlineSubmissions
          .where(inputColumn)
          .equals(inputId)
          .first();
      }

      if (!draft) {
        console.log(`No record found with ${inputColumn}: ${inputId}`);
        return null;
      }
      return draft;
    } catch (error) {
      console.error(
        `Error fetching data from offlineSubmission with ${inputColumn}: ${inputId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Fetches a specific offline draft by ID from the "offlineSubmission" table.
   *
   * @param draftId - The ID of the draft to retrieve.
   * @returns A promise resolving to the draft data or null if not found.
   * @throws Error if IndexedDB is unavailable or the table is missing.
   */
  public static async fetchOfflineDraftById(
    localDraftId: string
  ): Promise<any> {
    try {
      const draft = await this.fetchOfflineSubmissionByInputId(
        localDraftId,
        "localDraftId"
      );
      const updatedDraft = DBServiceHelper.transformEditDraftData(draft);
      return updatedDraft;
    } catch (error) {
      console.error(
        `Error fetching data from offlineSubmission with localDraftId ${localDraftId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Fetch all non active offline submissions.
   * @returns all non active offline submissions.
   */
  public static async fetchAllNonActiveOfflineSubmissions(): Promise<
    OfflineSubmission[]
  > {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }
      await ffDb.open();
      // Get the localDraftId from the activeForm table.
      const activeForm = await ffDb.activeForm.limit(1).first();
      const localDraftId = activeForm?.localDraftId;
      // Get all non active offline submissions.
      const submissions = await ffDb.offlineSubmissions
        .filter((eachRow) => eachRow.localDraftId !== localDraftId)
        .toArray();

      return submissions;
    } catch (error) {
      console.error("Error fetching data.", error);
      throw error;
    }
  }

  /**
   * Fetches the offline submission from the "applications" table based on ID.
   *
   * @returns A promise resolving to an object containing submission.
   * @throws Error if IndexedDB is unavailable or the table is missing.
   */
  public static async fetchApplicationById(
    applicationId: number
  ): Promise<any> {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }
      await ffDb.open();
      // Get reference to the formDefinition table
      const offlineApplications = ffDb["applications"];
      if (!offlineApplications) {
        throw new Error("Table application not found in IndexedDB.");
      }
      // Fetch row by ID
      const application = await offlineApplications
        .where("id")
        .equals(Number(applicationId))
        .first();
      if (!application) {
        console.log(`No record found with id: ${applicationId}`);
        return null;
      }
      return application;
    } catch (error) {
      console.error(
        `Error fetching data from application with id ${applicationId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Fetch all drafts to be deleted from the indexdb deleted  draft table.
   * @returns all drafts to be deleted.
   */
  public static async fetchAllDraftDelete(): Promise<DeletedDraft[]> {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }
      await ffDb.open();
      return ffDb.deletedDrafts.toArray();
    } catch (error) {
      console.error("Error fetching data.", error);
      throw error;
    }
  }
}
export default OfflineFetchService;
