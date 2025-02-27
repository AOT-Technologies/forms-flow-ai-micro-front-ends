import { rsbcDb } from "./rsbcDb";
import { ffDb, IndividualFormDefinition } from "./ffDb";
import { fetchStaticData } from "../request/staticDataApi";
import { handleError } from "../helpers/helperServices";
import { StaticResources } from "../constants/constants";
import OfflineFetchService from "./dbFetchServices";
import DBServiceHelper from "../helpers/helperDbServices";
import { fetchFormIDs } from "../request/formIdApi";
import { FORM_ID_12HOUR_LIMIT, FORM_ID_24HOUR_LIMIT, FORM_ID_VI_LIMIT } from "./config";

class OfflineSaveService {
  
  /**
   * Saves RSBC static data to IndexedDB.
   * @param {string} resourceName - The name of the resource.
   * @param {any} data - The data to be saved.
   */
  private static async saveRSBCDataToIndexedDB(resourceName: string, data: any) {
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
        default:
          console.log(`No matching table found for resource: ${resourceName}`);
      }
    } catch (error) {
      console.error(`Error saving ${resourceName} to IndexedDB:`, error);
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

  public static async saveOfflineFormDefinition(form: IndividualFormDefinition): Promise<void> {
    try {
      if (!ffDb) {
        throw new Error("IndexedDB is not available.");
      }

      if (!form) {
        console.warn("No valid form provided.");
        return;
      }
      await ffDb.formDefinitions.put(form);
      console.log(`Form with ID ${form._id} added or updated in IndexedDB.`);
    } catch (error) {
      console.error("Error saving form to IndexedDB:", error);
    }
  }

  /**
   * Saves FormFlow data to IndexedDB.
   * @param {string} resourceName - The name of the resource.
   * @param {any} data - The data to be saved.
   */
  private static async saveFFDataToIndexedDB(resourceName: string, data: any) {
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
        case "formDefinitionList":
          await ffDb.formDefinitionList.clear();
          await ffDb.formDefinitionList.bulkPut(data.forms);
          await ffDb.formListMetaData.clear();
          await ffDb.formListMetaData.put({
            key: "metadata",
            totalCount: data.totalCount,
            pageNo: data.pageNo,
            limit: data.limit
          })
          console.log("Form List data saved to IndexedDB.");
          break;
        case "applications":
          // await ffDb.application.clear();
          await ffDb.applications.put(data);
          break;
        case "drafts":
          await ffDb.drafts.clear();
          await ffDb.drafts.bulkPut(data.drafts);
          await ffDb.draftMetaData.put({
            key: "metadata",
            applicationCount: data.applicationCount,
            totalCount: data.totalCount,
          })
          console.log("Drafts data saved to IndexedDB.");
          break;
        case "offlineSubmission":
          // await ffDb.submission.clear();
          await ffDb.offlineSubmissions.put(data);
          console.log("Offline submission data saved to IndexedDB.");
          break;
        default:
          console.log(`No matching table found for resource: ${resourceName}`);
      }
    } catch (error) {
      console.error(`Error saving ${resourceName} to IndexedDB:`, error);
    }
  }  
  
  /**
   * Inserts submission data into IndexedDB.
   * @param {any} data - Submission data to be stored.
   * @param {string} formId - Form ID associated with the submission.
   */
  public static async insertSubmissionData (data: any, formId: string): Promise<void> {
    try {
      const formData = await OfflineFetchService.fetchOfflineFormById(formId);
      const submissionData = DBServiceHelper.constructOfflineSubmissionData(data, formId);
      const applicationData = DBServiceHelper.constructApplicationData(formId, submissionData.localSubmissionId, formData);
      await this.saveFFDataToIndexedDB("offlineSubmission", submissionData);
      await this.saveFFDataToIndexedDB("applications", applicationData);
    } catch (error) {
      console.error(`Error processing offline submission or application data:`, error);
    }
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

      const required12Hour = Math.max(0, FORM_ID_12HOUR_LIMIT - (countByFormType["12Hour"] || 0));
      const required24Hour = Math.max(0, FORM_ID_24HOUR_LIMIT - (countByFormType["24Hour"] || 0));
      const requiredVI = Math.max(0, FORM_ID_VI_LIMIT - (countByFormType["VI"] || 0));
      try {
        const requiredIds = {
          "12Hour": required12Hour,
          "24Hour": required24Hour,
          "VI": requiredVI,
        };
        const now_ts = new Date().toUTCString()
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
              created: now_ts,
              last_updated: now_ts,
            }));
            if(formIdData && formIdData.length > 0){
              await this._saveForIdDataToIndexedDB(formIdData);
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
  public static async markFormAsLeased(formId: number, formType: string): Promise<void> {
    try {
      if (!rsbcDb.formID) {
        throw new Error("FormID table is not available.");
      }
      const form = await rsbcDb.formID.where({ id: formId, form_type: formType }).first();
      if (!form) {
        throw new Error(`Form with ID ${formId} and type ${formType} not found.`);
      }
      await rsbcDb.formID.update(form.id, { leased: true, last_updated: new Date().toUTCString() });
    } catch (error) {
      console.error(`Error updating lease status in IndexedDB:`, error);
    }
  }

  /**
   * private function to save formID data to IndexedDB.
   * @param data - list of formID data to be saved.
   * @private
   */
  private static async _saveForIdDataToIndexedDB(data: any) : Promise<void> {
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

}
export default OfflineSaveService;
