import { rsbcDb } from "./rsbcDb";
import { ffDb, IndividualFormDefinition } from "./ffDb";
import { StaticTables } from "../constants/constants";
import DBServiceHelper from "../helpers/helperDbServices";

class OfflineFetchService {
  
  /**
   * Fetches static data from a given table in IndexedDB.
   * Ensures that the table is within the predefined static tables list.
   * 
   * @param tableName - Name of the table to fetch data from.
   * @returns A promise that resolves to an array of records from the table.
   * @throws Error if IndexedDB is unavailable, the table is inaccessible, or data retrieval fails.
   */
  public static async fetchStaticDataFromTable(tableName: string): Promise<any[]> {
    try {
      if (!rsbcDb) throw new Error("IndexedDB is not available.");
      if (!StaticTables.includes(tableName)) throw new Error(`Table ${tableName} is not accessible.`);
  
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
        console.error(`Error fetching data from formDefinition with id ${formId}:`, error);
        throw error;
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
      limit: 5
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
      const data = await table.toArray();
      if (data.length === 0) {
        console.log(`No data found in table application.`);
        return;
      }
      // Fetch Metadata for the submission dashboard
      const metadata = this.getMetadata(data);
      const finalData: Record<string, any> = {
        ["applications"]: data,
        metadata
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
  public static async fetchOfflineSubmissionById(submissionId: string): Promise<any> {
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

        // Fetch row by ID
        const submission = await offlineSubmissions
          .where("localSubmissionId")
          .equals(submissionId)
          .first();
        if (!submission) {
            console.log(`No record found with id: ${submissionId}`);
            return null;
        }
        const updatedSubmission = DBServiceHelper.transformFinalSubmissionData(submission);

        return updatedSubmission;
    } catch (error) {
        console.error(`Error fetching data from offlineSubmission with id ${submissionId}:`, error);
        throw error;
    }
  }
  /**
     * Retrieves all form definitions from IndexedDB.
     */
  private static async getOriginalFormDefinitions(): Promise<IndividualFormDefinition[]> {
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
      const finalData = DBServiceHelper.transformFormDefinitions(forms, totalCount);
      return finalData;
    } catch (error) {
      console.error("Error fetching and transforming form definitions:", error);
      return { forms: [], limit: 5, pageNo: 1, totalCount: 0 };
    }
  }
  
}
export default OfflineFetchService;
