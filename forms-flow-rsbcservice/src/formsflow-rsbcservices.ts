// export all services here
import { fetchAndSaveStaticData } from "./helpers/helperServices";
import DBService from "./storage/dbService";

(async () => {
  try {
    await fetchAndSaveStaticData();
  } catch (error) {
    console.error("Error in fetching and saving static data:", error);
  }
})();

export { DBService };
