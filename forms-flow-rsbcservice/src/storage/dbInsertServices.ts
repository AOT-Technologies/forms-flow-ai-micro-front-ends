import { rsbcDb } from "./rsbcDb";
import {
  ffDb,
  IndividualFormDefinition,
  ActiveForm,
  FormProcess,
} from "./ffDb";
import { fetchStaticData } from "../request/staticDataApi";
import { handleError } from "../helpers/helperServices";
import { StaticResources } from "../constants/constants";
import OfflineFetchService from "./dbFetchServices";
import DBServiceHelper from "../helpers/helperDbServices";
import { fetchFormIDs } from "../request/formIdApi";
import { getUserData } from "../request/getUserDataApi";
import { getUserRoles } from "../request/getUserRolesApi";
import {
  REACT_APP_FORM_ID_12HOUR_LIMIT,
  REACT_APP_FORM_ID_24HOUR_LIMIT,
  REACT_APP_FORM_ID_MV6020_LIMIT,
  REACT_APP_FORM_ID_VI_LIMIT,
} from "./config";

class OfflineSaveService {
  /**
   * Saves RSBC static data to IndexedDB.
   * @param {string} resourceName - The name of the resource.
   * @param {any} data - The data to be saved.
   */
  private static async saveRSBCDataToIndexedDB(
    resourceName: string,
    data: any
  ) {
    try {
      // Check if IndexedDB is available
      if (!rsbcDb) {
        throw new Error("IndexedDB is not available.");
      }

      // Check if data is valid
      if (!data || data.length === 0) {
        throw new Error(`No valid data provided for ${resourceName}.`);
      }
      // resourceName: static table names
      switch (resourceName) {
        case "agencies":
          await rsbcDb.agencies.clear();
          await rsbcDb.agencies.bulkPut(data);
          console.log("Agencies data saved to IndexedDB.");
          break;
        case "cities":
          await rsbcDb.cities.clear();
          await rsbcDb.cities.bulkPut(data);
          console.log("Cities data saved to IndexedDB.");
          break;
        case "countries":
          await rsbcDb.countries.clear();
          await rsbcDb.countries.bulkPut(data);
          console.log("Countries data saved to IndexedDB.");
          break;
        case "jurisdictions":
          await rsbcDb.jurisdictions.clear();
          await rsbcDb.jurisdictions.bulkPut(data);
          console.log("Jurisdictions data saved to IndexedDB.");
          break;
        case "impound_lot_operators":
          await rsbcDb.impoundLotOperators.clear();
          await rsbcDb.impoundLotOperators.bulkPut(data);
          console.log("Impound Lot Operators data saved to IndexedDB.");
          break;
        case "provinces":
          await rsbcDb.provinces.clear();
          await rsbcDb.provinces.bulkPut(data);
          console.log("Provinces data saved to IndexedDB.");
          break;
        case "vehicle_styles":
          await rsbcDb.vehicleStyles.clear();
          await rsbcDb.vehicleStyles.bulkPut(data);
          console.log("Vehicle Styles data saved to IndexedDB.");
          break;
        case "vehicle_types":
          await rsbcDb.vehicleTypes.clear();
          await rsbcDb.vehicleTypes.bulkPut(data);
          console.log("Vehicle Types data saved to IndexedDB.");
          break;
        case "vehicle_colours":
          await rsbcDb.vehicleColours.clear();
          await rsbcDb.vehicleColours.bulkPut(data);
          console.log("Vehicle Colours data saved to IndexedDB.");
          break;
        case "vehicles":
          await rsbcDb.vehicles.clear();
          await rsbcDb.vehicles.bulkPut(data);
          console.log("Vehicles data saved to IndexedDB.");
          break;
        case "nsc_puj":
          await rsbcDb.nscPuj.clear();
          await rsbcDb.nscPuj.bulkPut(data);
          console.log("NSC PUJ data saved to IndexedDB.");
          break;
        case "jurisdiction_country":
          await rsbcDb.jurisdictionCountry.clear();
          await rsbcDb.jurisdictionCountry.bulkPut(data);
          console.log("Jurisdiction Country data saved to IndexedDB.");
          break;
        case "user":
          await rsbcDb.user.clear();
          await rsbcDb.user.put(data);
          console.log("User data saved to IndexedDB.");
          break;
        case "userRoles":
          await rsbcDb.userRoles.clear();
          await rsbcDb.userRoles.bulkPut(data);
          console.log("User roles saved to IndexedDB.");
          break;
        case "lki_highway":
          await rsbcDb.lkiHighway.clear();
          await rsbcDb.lkiHighway.bulkPut(data);
          console.log("LKI Highway data saved to IndexedDB.");
          break;
        case "lki_segment":
          await rsbcDb.lkiSegment.clear();
          await rsbcDb.lkiSegment.bulkPut(data);
          console.log("LKI Segment data saved to IndexedDB.");
          break;
        default:
          console.log(`No matching table found for resource: ${resourceName}`);
      }
    } catch (error) {
      console.error(`Error saving ${resourceName} to IndexedDB:`, error);
    }
  }

  /**
   * private function to save formID data to IndexedDB.
   * @param data - list of formID data to be saved.
   * @private
   */
  private static async _saveFormIdDataToIndexedDB(data: any): Promise<void> {
    try {
      if (!rsbcDb) {
        throw new Error("IndexedDB is not available.");
      }
      if (!data || data.length === 0) {
        throw new Error(`No valid data provided for formID.`);
      }
      await rsbcDb.formID.bulkPut(data);
    } catch (error) {
      console.error(`Error saving formID to IndexedDB:`, error);
    }
  }

  /**
   * Fetches static data from API and saves it to IndexedDB.
   */
  public static async fetchAndSaveStaticData(): Promise<void> {
    try {
      await rsbcDb.open();
      console.log("Fetching and saving static data...");

      // Create an array of promises for fetching data
      const fetchPromises = StaticResources.map(async (resource) => {
        try {
          await fetchStaticData(
            resource,
            (data: any) => this.saveRSBCDataToIndexedDB(resource, data),
            (error: any) => handleError(error)
          );
        } catch (error) {
          console.error(`Error processing resource ${resource}:`, error);
        }
      });

      // Wait for all API calls to complete in parallel
      await Promise.all(fetchPromises);

      console.log("All static data processed.");
    } catch (error) {
      console.error("Error in data fetching and saving process:", error);
    }
  }

  /**
   * Fetches user data and roles from API and saves it to IndexedDB.
   */
  public static async fetchAndSaveUserDataAndRoles(): Promise<void> {
    // get user data
    const userDetails = DBServiceHelper.getUserDetails();

    let userId = null;
    if (userDetails?.identity_provider === "idir") {
      userId = userDetails.idir_user_guid;
    } else if (userDetails?.identity_provider === "bceid") {
      userId = userDetails.bceid_user_guid;
    } else {
      userId = userDetails.sub; // for non BCGov Keycloak
    }
    if (userId) {
      await getUserData(
        userId,
        (data: any) => this.saveRSBCDataToIndexedDB("user", data),
        (error: any) => handleError(error)
      );
    }

    // get user roles
    await getUserRoles(
      DBServiceHelper.getAuthorizationToken(),
      (data: any) => this.saveRSBCDataToIndexedDB("userRoles", data),
      (error: any) => handleError(error)
    );
  }

  /**
   * Calculates the how many new form IDs are required and fetches them from the server
   * and save them to the IndexedDB with leased status as false.
   */
  public static async fetchAndSaveFormIDs(): Promise<any> {
    try {
      if (!rsbcDb.formID) {
        throw new Error("IndexedDB formID table is not available.");
      }
      const existingFormIds = await rsbcDb.formID.toArray();
      const countByFormType = existingFormIds.reduce((acc, obj) => {
        if (!obj.leased) {
          acc[obj.form_type] = (acc[obj.form_type] || 0) + 1;
        }
        return acc;
      }, {});

      const required12Hour = Math.max(
        0,
        REACT_APP_FORM_ID_12HOUR_LIMIT - (countByFormType["12Hour"] || 0)
      );
      const required24Hour = Math.max(
        0,
        REACT_APP_FORM_ID_24HOUR_LIMIT - (countByFormType["24Hour"] || 0)
      );
      const requiredVI = Math.max(
        0,
        REACT_APP_FORM_ID_VI_LIMIT - (countByFormType["VI"] || 0)
      );
      const requiredMV6020 = Math.max(
        0,
        REACT_APP_FORM_ID_MV6020_LIMIT - (countByFormType["MV6020"] || 0)
      );
      try {
        const requiredIds = {
          "12Hour": required12Hour,
          "24Hour": required24Hour,
          "VI": requiredVI,
          "MV6020": requiredMV6020,
        };

        await fetchFormIDs(
          requiredIds,
          async (data: any) => {
            const formIdData = data.forms.map((item: any) => ({
              id: item.id,
              form_type: item.form_type,
              user_guid: item.user_guid,
              leased: false,
              lease_expiry: item.lease_expiry,
              printed_timestamp: item.printed_timestamp,
              spoiled_timestamp: item.spoiled_timestamp,
              last_updated: new Date().toISOString(),
            }));
            if (formIdData && formIdData.length > 0) {
              await this._saveFormIdDataToIndexedDB(formIdData);
            }
          },
          (error: any) => {
            console.error("Error loading formIDs from the server:", error);
            return [];
          }
        );
      } catch (error) {
        console.error(`Error saving formIDs to indexed db:`, error);
      }
      if (existingFormIds.length === 0) {
        console.log(`No data found in table form_id.`);
      }
      const latestIds = await rsbcDb.formID.toArray();
      return latestIds;
    } catch (error) {
      console.error(`Error fetching data from table form_id:`, error);
      throw error;
    }
  }

  /**
   * Marks a form as leased in IndexedDB.
   * @param formId - The form ID.
   * @param formType - The form type.
   */
  public static async markFormAsLeased(
    formId: number,
    formType: string
  ): Promise<void> {
    try {
      if (!rsbcDb.formID) {
        throw new Error("FormID table is not available.");
      }
      const form = await rsbcDb.formID
        .where({ id: formId, form_type: formType })
        .first();
      if (!form) {
        throw new Error(
          `Form with ID ${formId} and type ${formType} not found.`
        );
      }
      await rsbcDb.formID.update(form.id, {
        leased: true,
        last_updated: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error updating lease status in IndexedDB:`, error);
    }
  }

  public static async saveOfflineFormDefinitions(
    forms: IndividualFormDefinition[]
  ): Promise<void> {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }

      if (!Array.isArray(forms) || forms.length === 0) {
        console.warn("No valid forms provided.");
        return;
      }
      await ffDb.formDefinitions.clear();
      await ffDb.formDefinitions.bulkPut(forms);

      console.log(`${forms.length} forms added or updated in IndexedDB.`);
    } catch (error) {
      console.error("Error saving forms to IndexedDB:", error);
    }
  }

  /**
   * Saves FormFlow data to IndexedDB.
   * @param {string} resourceName - The name of the resource.
   * @param {any} data - The data to be saved.
   */
  public static async saveFFDataToIndexedDB(resourceName: string, data: any) {
    try {
      // Check if IndexedDB is available
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }

      // Check if data is valid
      if (!data || data.length === 0) {
        throw new Error(`No valid data provided for ${resourceName}.`);
      }

      switch (resourceName) {
        case "applications":
          await ffDb.applications.put(data);
          break;
        case "offlineSubmission":
          await ffDb.offlineSubmissions.put(data);
          console.log("Offline submission data saved to IndexedDB.");
          break;
        case "activeForm":
          await ffDb.activeForm.clear();
          await ffDb.activeForm.put(data);
          console.log("Offline activeForm data saved to IndexedDB.");
          break;
        default:
          console.log(`No matching table found for resource: ${resourceName}`);
      }
    } catch (error) {
      console.error(`Error saving ${resourceName} to IndexedDB:`, error);
    }
  }

  /**
   * Inserts form process data into the formProcesses table in IndexedDB.
   *
   * @param data - Array of form process objects to insert
   * @returns A promise that resolves to an object with status and message
   * @throws Error if IndexedDB is unavailable or insertion fails.
   */
  public static async insertDataIntoFormProcessTable(
    data: FormProcess[]
  ): Promise<{ status: string; message?: string }> {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }
      await ffDb.open();

      // Get reference to the specified table
      const table = ffDb["formProcesses"];

      if (!table) {
        throw new Error(`Table formProcesses not found in IndexedDB.`);
      }

      // Validate input
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid input: data must be a non-empty array");
      }
      await ffDb.formProcesses.clear();
      await table.bulkPut(data);

      return {
        status: "success",
        message: `Successfully inserted ${data.length} form processes.`,
      };
    } catch (error) {
      console.error(`Error inserting data into formProcesses:`, error);
      return { status: "failure", message: error.message };
    }
  }

  /**
   * Inserts submission data into IndexedDB.
   * @param {any} data - Submission data to be stored.
   * @param {string} formId - Form ID associated with the submission.
   */
  public static async insertOfflineSubmissionData(
    data: any,
    formId: string,
    serverDraftId: string,
    serverApplicationId: number
  ): Promise<{ status: string; message?: string }> {
    try {
      let draft = await OfflineFetchService.fetchOfflineSubmissionByInputId(
        serverDraftId,
        "serverDraftId"
      );
      if (!draft) {
        draft = DBServiceHelper.constructOfflineSubmissionData(
          data,
          formId,
          serverDraftId,
          serverApplicationId
        );
      } else {
        draft = DBServiceHelper.constructUpdateOfflineSubmissionData(
          draft,
          data,
          serverDraftId,
          serverApplicationId
        );
      }
      const formData = await OfflineFetchService.fetchOfflineFormById(formId);

      const applicationData = DBServiceHelper.constructApplicationData(
        formId,
        draft.localSubmissionId,
        formData,
        data
      );
      await this.saveFFDataToIndexedDB("offlineSubmission", draft);
      await this.saveFFDataToIndexedDB("applications", applicationData);
      await ffDb.activeForm.clear();
      return {
        status: "success",
        message: `Submission inserted successfully.`,
      };
    } catch (error) {
      console.error(
        `Error processing offline submission or application data:`,
        error
      );
      return { status: "error", message: error.message };
    }
  }

  /**
   * Inserts submission data into IndexedDB.
   * @param {any} draft - Submission data to be stored.
   */
  public static async insertOfflineDraftData(
    draft: any,
    serverDraftId: number | null = null,
    serverApplicationId: number | null = null
  ): Promise<Record<string, any>> {
    try {
      const formId = draft?.formId;
      if (!formId) {
        console.warn("No valid formId found. Using empty formData.");
      }
      const offlineSubmissions = ffDb["offlineSubmissions"];
      if (!offlineSubmissions) {
        throw new Error("Table offlineSubmissions not found in IndexedDB.");
      }
      const now = new Date().toISOString();
      const formData = formId
        ? await OfflineFetchService.fetchOfflineFormById(formId)
        : {};
      const offlineDraft = DBServiceHelper.constructOfflineDraftData(
        draft,
        formId,
        formData,
        now,
        serverApplicationId
      );
      let draftResponse: Record<string, any>;
      await ffDb.offlineSubmissions.put(offlineDraft);

      const activeFormData = {
        localDraftId: offlineDraft?.localDraftId,
        serverDraftId: serverDraftId ?? null,
      };
      await this.saveFFDataToIndexedDB("activeForm", activeFormData);
      const transformedDrafts =
        DBServiceHelper.transformEditDraftData(offlineDraft);
      // if (!serverDraftId) {
      draftResponse = DBServiceHelper.constructDraftResponse(
        offlineDraft?.draftData?.localApplicationId,
        offlineDraft?.localDraftId,
        now,
        draft?.data,
        offlineDraft?._id
      );
      // }
      return {
        res: draftResponse,
        draftDetails: transformedDrafts,
      };
    } catch (error) {
      console.error(
        "Error processing offline draft or application data:",
        error
      );
    }
  }

  // This will insert either localDraftId alone or (localDraftId, serverDraftId) together
  public static async insertDataIntoActiveFormTable(
    data: ActiveForm
  ): Promise<{ status: string; message?: string }> {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }
      await ffDb.open();

      // Get reference to the specified table
      const table = ffDb["activeForm"];

      if (!table) {
        throw new Error(`Table activeForm not found in IndexedDB.`);
      }

      // Insert the record into IndexedDB
      await table.clear();
      await table.put(data);

      return {
        status: "success",
        message: `Data inserted into activeForm successfully.`,
      };
    } catch (error) {
      console.error(`Error inserting data into activeForm:`, error);
      return { status: "failure", message: error.message };
    }
  }

  // This will insert offline deleted serverDraftId into deletedDrafts table
  public static async saveOfflineDeletedDraft(
    serverDraftId: number | null
  ): Promise<{ status: string; message?: string }> {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }
      await ffDb.open();

      // Get reference to the specified table
      const table = ffDb["deletedDrafts"];

      if (!table) {
        throw new Error(`Table deletedDrafts not found in IndexedDB.`);
      }
      const data = {
        serverDraftId,
      };
      // Insert the record into IndexedDB
      await table.put(data);

      return {
        status: "success",
        message: `Data inserted into deletedDrafts successfully.`,
      };
    } catch (error) {
      console.error(`Error inserting data into deletedDrafts:`, error);
      return { status: "failure", message: error.message };
    }
  }
}
export default OfflineSaveService;
