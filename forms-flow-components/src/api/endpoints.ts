import { DOCUMENT_SERVICE_URL } from "./config";

const API = {
  EXPORT_FORM_PDF: `${DOCUMENT_SERVICE_URL}/form/<form_id>/submission/<submission_id>/export/pdf`,
};

export default API;
