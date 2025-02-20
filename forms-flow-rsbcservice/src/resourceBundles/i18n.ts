import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { InitOptions } from "i18next";
import { i18nService } from "@formsflow/service";

const initOptions: InitOptions = {
  fallbackLng: "en",
};

// Ensure that the `i18nService` conforms to the i18next type
i18nService
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(initOptions);

export default i18nService;
