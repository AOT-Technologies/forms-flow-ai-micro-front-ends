import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import i18n from "i18next";

// Check if we're in Storybook environment or if @formsflow/service is available
let i18nService;

try {
  // Try to import from @formsflow/service
  const { i18nService: serviceI18n } = require("@formsflow/service");
  i18nService = serviceI18n;
} catch (error) {
  // Fallback to local i18n instance for Storybook or when service is not available
  i18nService = i18n;
}

i18nService.use(LanguageDetector)
.use(initReactI18next)
.init({
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        // Basic translations for Storybook
        "Choose a file to upload": "Choose a file to upload",
        "File upload area": "File upload area",
        "Upload file area": "Upload file area",
        "File upload progress": "File upload progress",
        "Upload progress bar": "Upload progress bar",
        "Importing": "Importing",
        "Cancel": "Cancel",
        "There was an error in the upload": "There was an error in the upload",
        "Try Again": "Try Again",
        "Upload Complete!": "Upload Complete!",
        "Done": "Done",
        "Drag a file to this area to import it": "Drag a file to this area to import it",
        " (form, layout or bpmn)": " (form, layout or bpmn)",
        "Support for a single": "Support for a single",
        " file upload.": " file upload.",
        "Maximum file size": "Maximum file size",
        "MB.": "MB.",
        "Information": "Information",
        "Warning": "Warning",
        "Success": "Success",
        "Error": "Error",
        "OK": "OK",
        "Continue": "Continue",
        "Retry": "Retry",
        "Primary": "Primary",
        "Secondary": "Secondary",
        "Third": "Third",
        "Processing": "Processing",
        "Please wait while we process your request...": "Please wait while we process your request...",
        "Confirmation Required": "Confirmation Required",
        "Some buttons are disabled in this example.": "Some buttons are disabled in this example.",
        "Simple Confirmation": "Simple Confirmation",
        "Terms and Conditions": "Terms and Conditions",
        "This is a very long message that demonstrates how the modal handles extended content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.": "This is a very long message that demonstrates how the modal handles extended content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        "I Agree": "I Agree",
        "Decline": "Decline",
        "Custom Modal": "Custom Modal",
        "Customize this modal using the controls below.": "Customize this modal using the controls below.",
        "This action cannot be undone. Are you sure you want to continue?": "This action cannot be undone. Are you sure you want to continue?",
        "Your changes have been saved successfully.": "Your changes have been saved successfully.",
        "Something went wrong. Please try again.": "Something went wrong. Please try again.",
        "This will affect multiple items. Choose your action:": "This will affect multiple items. Choose your action:",
        "Save All": "Save All",
        "Save Selected": "Save Selected",
        "Confirm Action": "Confirm Action"
      }
    }
  }
});

export default i18nService;
