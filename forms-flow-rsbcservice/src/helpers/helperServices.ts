import { fetchStaticData } from "../request/staticDataApi";
import DBService from "../storage/dbService";

// Error handler function
const handleError = (error: string) => {
  console.error("Error:", error);
};

export const fetchAndSaveStaticData = async () => {
  try {
    console.log("Fetching and saving static data...");

    const resources = [
      "agencies",
      "cities",
      "countries",
      "jurisdictions",
      "impound_lot_operators",
      "provinces",
      "vehicle_styles",
      "vehicle_types",
      "vehicle_colours",
      "vehicles",
      "nsc_puj",
      "jurisdiction_country",
    ];

    for (const resource of resources) {
      await fetchStaticData(
        resource,
        (data: any) => DBService.saveToIndexedDB(resource, data),
        (error: any) => handleError(error)
      );
    }

    console.log("All static data fetched and saved successfully.");
  } catch (error) {
    console.error("Error in data fetching and saving process:", error);
  }
};
