import { db } from "./db";

class DBService {
  public static async saveToIndexedDB(resourceName: string, data: any) {
    try {
      switch (resourceName) {
        case "agencies":
          await db.agencies.clear();
          await db.agencies.bulkPut(data);
          console.log("Agencies data saved to IndexedDB.");
          break;
        case "cities":
          await db.cities.clear();
          await db.cities.bulkPut(data);
          console.log("Cities data saved to IndexedDB.");
          break;
        case "countries":
          await db.countries.clear();
          await db.countries.bulkPut(data);
          console.log("Countries data saved to IndexedDB.");
          break;
        case "jurisdictions":
          await db.jurisdictions.clear();
          await db.jurisdictions.bulkPut(data);
          console.log("Jurisdictions data saved to IndexedDB.");
          break;
        case "impound_lot_operators":
          await db.impoundLotOperators.clear();
          await db.impoundLotOperators.bulkPut(data);
          console.log("Impound Lot Operators data saved to IndexedDB.");
          break;
        case "provinces":
          await db.provinces.clear();
          await db.provinces.bulkPut(data);
          console.log("Provinces data saved to IndexedDB.");
          break;
        case "vehicle_styles":
          await db.vehicleStyles.clear();
          await db.vehicleStyles.bulkPut(data);
          console.log("Vehicle Styles data saved to IndexedDB.");
          break;
        case "vehicle_types":
          await db.vehicleTypes.clear();
          await db.vehicleTypes.bulkPut(data);
          console.log("Vehicle Types data saved to IndexedDB.");
          break;
        case "vehicle_colours":
          await db.vehicleColours.clear();
          await db.vehicleColours.bulkPut(data);
          console.log("Vehicle Colours data saved to IndexedDB.");
          break;
        case "vehicles":
          await db.vehicles.clear();
          await db.vehicles.bulkPut(data);
          console.log("Vehicles data saved to IndexedDB.");
          break;
        case "nsc_puj":
          await db.nscPuj.clear();
          await db.nscPuj.bulkPut(data);
          console.log("NSC PUJ data saved to IndexedDB.");
          break;
        case "jurisdiction_country":
          await db.jurisdictionCountry.clear();
          await db.jurisdictionCountry.bulkPut(data);
          console.log("Jurisdiction Country data saved to IndexedDB.");
          break;
        default:
          console.log(`No matching table found for resource: ${resourceName}`);
      }
    } catch (error) {
      console.error(`Error saving ${resourceName} to IndexedDB:`, error);
    }
  }
  public static async fetchStaticDataFromTable(
    tableName: string
  ): Promise<any[]> {
    try {
      // Ensure the database is open before performing any operations
      await db.open();

      // Dynamically access the table using the tableName argument
      const table = db[tableName];

      // Fetch all records from the table
      const data = await table.toArray();

      return data;
    } catch (error) {
      console.error(`Error fetching data from table ${tableName}:`, error);
      throw error; // Propagate the error so it can be handled by the caller
    }
  }
}
export default DBService;
// // Callback function to save data to IndexedDB
// export const saveToIndexedDB = async (resourceName: string, data: any) => {
//   try {
//     switch (resourceName) {
//       case "agencies":
//         await db.agencies.clear();
//         await db.agencies.bulkPut(data);
//         console.log("Agencies data saved to IndexedDB.");
//         break;
//       case "cities":
//         await db.cities.clear();
//         await db.cities.bulkPut(data);
//         console.log("Cities data saved to IndexedDB.");
//         break;
//       case "countries":
//         await db.countries.clear();
//         await db.countries.bulkPut(data);
//         console.log("Countries data saved to IndexedDB.");
//         break;
//       case "jurisdictions":
//         await db.jurisdictions.clear();
//         await db.jurisdictions.bulkPut(data);
//         console.log("Jurisdictions data saved to IndexedDB.");
//         break;
//       case "impound_lot_operators":
//         await db.impoundLotOperators.clear();
//         await db.impoundLotOperators.bulkPut(data);
//         console.log("Impound Lot Operators data saved to IndexedDB.");
//         break;
//       case "provinces":
//         await db.provinces.clear();
//         await db.provinces.bulkPut(data);
//         console.log("Provinces data saved to IndexedDB.");
//         break;
//       case "vehicle_styles":
//         await db.vehicleStyles.clear();
//         await db.vehicleStyles.bulkPut(data);
//         console.log("Vehicle Styles data saved to IndexedDB.");
//         break;
//       case "vehicle_types":
//         await db.vehicleTypes.clear();
//         await db.vehicleTypes.bulkPut(data);
//         console.log("Vehicle Types data saved to IndexedDB.");
//         break;
//       case "vehicle_colours":
//         await db.vehicleColours.clear();
//         await db.vehicleColours.bulkPut(data);
//         console.log("Vehicle Colours data saved to IndexedDB.");
//         break;
//       case "vehicles":
//         await db.vehicles.clear();
//         await db.vehicles.bulkPut(data);
//         console.log("Vehicles data saved to IndexedDB.");
//         break;
//       case "nsc_puj":
//         await db.nscPuj.clear();
//         await db.nscPuj.bulkPut(data);
//         console.log("NSC PUJ data saved to IndexedDB.");
//         break;
//       case "jurisdiction_country":
//         await db.jurisdictionCountry.clear();
//         await db.jurisdictionCountry.bulkPut(data);
//         console.log("Jurisdiction Country data saved to IndexedDB.");
//         break;
//       default:
//         console.log(`No matching table found for resource: ${resourceName}`);
//     }
//   } catch (error) {
//     console.error(`Error saving ${resourceName} to IndexedDB:`, error);
//   }
// };

// export const fetchStaticDataFromTable = async (
//   tableName: string
// ): Promise<any[]> => {
//   try {
//     // Ensure the database is open before performing any operations
//     await db.open();

//     // Dynamically access the table using the tableName argument
//     const table = db[tableName];

//     // Fetch all records from the table
//     const data = await table.toArray();

//     return data;
//   } catch (error) {
//     console.error(`Error fetching data from table ${tableName}:`, error);
//     throw error; // Propagate the error so it can be handled by the caller
//   }
// };
