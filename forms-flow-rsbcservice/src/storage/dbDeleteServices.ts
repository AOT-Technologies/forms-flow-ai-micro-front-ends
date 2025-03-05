import { ffDb, OfflineSubmission } from "./ffDb";
import DBServiceHelper from "../helpers/helperDbServices";
import OfflineFetchService from "./dbFetchServices";
import OfflineSaveService from "./dbInsertServices";

class OfflineDeleteService {
  
  public static async deleteOfflineDraftData(draftId: string): Promise<{ status: string; message?: string }> {
    try {
        const localDraftId = Number(draftId);

        if (isNaN(localDraftId)) {
            console.error("Invalid inputValue: Not a valid number");
            return { status: "error", message: `Invalid inputValue: Not a valid number` };
        }
        if (!ffDb) {
            throw new Error("IndexedDB is not available.");
        }
        await ffDb.open();

        // Get reference to the offlineSubmissions table
        const offlineSubmissions = ffDb["offlineSubmissions"];

        if (!offlineSubmissions) {
            throw new Error("Table offlineSubmissions not found in IndexedDB.");
        }

        // delete the draft by localDraftId
        const deletedCount: number = await offlineSubmissions
            .where("localDraftId")
            .equals(localDraftId)
            .delete();

        if (deletedCount > 0) {
            await ffDb.activeForm.clear();
            return { status: "success" };
        } else {
            return { status: "success", message: `No draft found with localDraftId: ${localDraftId}` };
        }
    } catch (error) {
        console.error(`Error deleting draft data for localDraftId ${draftId}:`, error);
        return { status: "error", message: error.message };
    }
  }

  public static async deleteActiveFormData(): Promise<{ status: string; message?: string }> {
    try {
        if (!ffDb) {
            throw new Error("IndexedDB is not available.");
        }
        await ffDb.open();

        // Get reference to the activeForm table
        const table = ffDb["activeForm"];

        if (!table) {
            throw new Error("Table activeForm not found in IndexedDB.");
        }

        await table.clear();
        return { status: "success", message: "activeForm table cleared successfully!" };
    } catch (error) {
        console.error(`Error in clearing activeForm table:`, error);
        return { status: "error", message: error.message };
    }
  }


}
export default OfflineDeleteService;
