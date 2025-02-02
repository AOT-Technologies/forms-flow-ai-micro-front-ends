import moment from "moment-timezone";
import twentyFourHourDriverform from "../assets/MV2634E_082023_driver.png";
import twentyFourHourILOform from "../assets/MV2634E_082023_ilo.png";
import twentyFourHourPoliceform from "../assets/MV2634E_082023_icbc.png";
import viDriverForm from "../assets/MV2721_202404.png";
import viIncidentDetails from "../assets/MV2722_202404_Incident_Details.png";
import appealsForm from "../assets/MV2721_202404_appeal.png";
import viReportForm from "../assets/MV2722_202404.png";
import twelveHourDriverForm from "../assets/MV2906E_082023_driver.png";
import twelveHourICBCForm from "../assets/MV2906E_082023_icbc.png";

interface FormEntry {
  png: string;
  aspectClass: string;
}

interface Stage {
  TwentyFourHour?: {
    DRIVER?: FormEntry;
    ILO?: FormEntry;
    POLICE?: FormEntry;
  };
  TwelveHour?: {
    DRIVER?: FormEntry;
    POLICE?: FormEntry;
  };
  VI?: {
    DRIVER?: FormEntry;
    APPEAL?: FormEntry;
    ILO?: FormEntry;
    POLICE?: FormEntry;
    REPORT?: FormEntry;
    DETAILS?: FormEntry;
  };
}

interface FormsPNG {
  stageOne: Stage;
  stageTwo: Stage;
}

export const formsPNG: FormsPNG = {
  stageOne: {
    TwentyFourHour: {
      DRIVER: { png: twentyFourHourDriverform, aspectClass: "--landscape" },
      ILO: { png: twentyFourHourILOform, aspectClass: "--landscape" },
    },
    TwelveHour: {
      DRIVER: { png: twelveHourDriverForm, aspectClass: "--landscape" },
    },
    VI: {
      DRIVER: { png: viDriverForm, aspectClass: "--portrait" },
      APPEAL: { png: appealsForm, aspectClass: "--portrait" },
      ILO: { png: viDriverForm, aspectClass: "--portrait" },
    },
  },
  stageTwo: {
    TwentyFourHour: {
      POLICE: { png: twentyFourHourPoliceform, aspectClass: "--landscape" },
    },
    TwelveHour: {
      POLICE: { png: twelveHourICBCForm, aspectClass: "--landscape" },
    },
    VI: {
      POLICE: { png: viDriverForm, aspectClass: "--portrait" },
      REPORT: { png: viReportForm, aspectClass: "--portrait" },
      DETAILS: { png: viIncidentDetails, aspectClass: "--portrait" },
    },
  },
};

interface FieldsToSplit {
  [key: string]: number;
}

const fieldsToSplit: FieldsToSplit = { VEHICLE_MAKE: 0, VEHICLE_MODEL: 1 };

interface DataEntry {
  field_name: string;
  delimeter?: string;
  barcode?: boolean;
  date_val?: string;
}

interface Values {
  [key: string]: any;
}

interface ImpoundLotOperator {
  name: string;
  name_print?: string;
}

export const printFormatHelper = (
    values: Values,
    data: DataEntry,
    key: string,
    impoundLotOperators: ImpoundLotOperator[]
): string => {
  let val = values[data.field_name];

  if (key in fieldsToSplit) {
    const rawValue = values[data.field_name];

    if (!rawValue) {
      return ""; // Return empty string if the value is null or undefined
    }

    const splitData =
        typeof rawValue === "object" && rawValue.value
            ? rawValue.value.split(data.delimeter || " ")
            : typeof rawValue === "string"
                ? rawValue.split(data.delimeter || " ")
                : [];

    // Ensure splitData is valid before accessing indices
    if (!Array.isArray(splitData) || splitData.length === 0) {
      return "";
    }

    val =
        typeof fieldsToSplit[key] === "number"
            ? splitData[fieldsToSplit[key]] || ""
            : splitData.slice(1).join(data.delimeter || " ");

    return val;
  }

  // If the field on the form is expecting more than one value, join them together
  if (Array.isArray(data.field_name)) {
    val = "";

    data.field_name.forEach((field, index) => {
      const fieldValue = values[field];

      if (fieldValue) {
        if (typeof fieldValue !== null && fieldValue === "object") {
          if (field === "offence_city") {
            val += fieldValue.label;
          } else if (field === "driver_prov_state") {
            val += fieldValue.value.includes("_") ? fieldValue.value.split("_")[1] : fieldValue.value;
          } else {
            val += fieldValue.value;
          }
        } else {
          val += fieldValue;
        }

        if (data.field_name.length > index + 1) {
          val += ", ";
        }
      }
    });

    // Add province to location of DL surrender
    if (key === "DL_SURRENDER_LOCATION") {
      val += ", BC";
    }

    // For registered owner, if owned by corp, display corp name instead of owner name
    if (key === "OWNER_NAME" && values["owned_by_corp"]) {
      val = values["corporation_name"];
    }

    return val;
  }

  // If the value is a barcode, strip the prefix characters
  if (data.barcode) {
    val = `*${String(val).slice(2)}*`;
  }

  // If the value is a date, format it properly
  if (values[data.field_name as string] instanceof Date) {
    val = moment(values[data.field_name as string]).format(data.date_val || "YYYY-MM-DD");
    return val;
  }

  // If the value is a list, join it into a single string
  if (Array.isArray(values[data.field_name as string])) {
    val = values[data.field_name as string].join("");
    return val;
  }

  // Format specific fields
  if (key === "DRIVER_DL_EXPIRY" && values.driver_licence_expiry) {
    return moment(values.driver_licence_expiry).format("YYYY");
  }

  if (key === "REPORT_DRIVER_DL_EXPIRY" && values.out_of_province_dl_expiry) {
    return moment(values.out_of_province_dl_expiry).format("YYYY");
  }

  // If the value is an object, extract its value safely
  if (typeof values[data.field_name as string] === "object" && values[data.field_name as string] !== null) {
    if (key === "LOCATION_CITY") {
      val = values[data.field_name as string]?.label;
    } else {
      val = values[data.field_name as string]?.value;
      val = String(val).includes("_") ? val.split("_")[1] : val;
    }
    return val;
  }

  // Determine the released vehicle reason
  let released_val = values["TwelveHour"] ? "vehicle_location" : values["TwentyFourHour"] ? "reason_for_not_impounding" : "";

  if (key === "NOT_IMPOUNDED_REASON") {
    val = {
      released: "RELEASED TO OTHER DRIVER",
      private: "PRIVATE TOW",
      roadside: "LEFT AT ROADSIDE",
      investigation: "SEIZED FOR INVESTIGATION"
    }[values[released_val]] || "";
  }

  // Assign vehicle release location
  if (key === "RELEASE_LOCATION_VEHICLE") {
    val = values["VI"] || (values["TwentyFourHour"] && values["vehicle_impounded"] === "YES") ? "IMPOUNDED" : {
      released: "RELEASED TO OTHER DRIVER",
      private: "PRIVATE TOW",
      roadside: "LEFT AT ROADSIDE",
      investigation: "SEIZED FOR INVESTIGATION"
    }[values[released_val]] || "";
  }

  // Assign key release location
  if (key === "RELEASE_LOCATION_KEYS") {
    val = values["VI"] || (values["TwentyFourHour"] && values["vehicle_impounded"] === "YES")
        ? values["location_of_keys"]
        : values[released_val] === "released"
            ? "WITH OTHER DRIVER"
            : values["location_of_keys"];
  }

  // Assign release person
  if (key === "RELEASE_PERSON") {
    val = values["VI"] || (values["TwentyFourHour"] && values["vehicle_impounded"] === "YES")
        ? ""
        : values[released_val] === "released"
            ? values["vehicle_released_to"]
            : values[released_val] === "private"
                ? values["ILO-name"]
                : "";
  }

  // Format incident details and split if too long
  if (key === "REPORT_INCIDENT_DETAILS" && values["incident_details"]?.length > 500) {
    val = values["incident_details"].substring(0, 500);
  }
  if (key === "DETAILS_INCIDENT_DETAILS" && values["incident_details"]?.length > 500) {
    val = values["incident_details"].substring(500);
  }

  // Assign impound lot name
  if (
      key === "IMPOUND_LOT_NAME" ||
      key === "IMPOUNDED_LOT" ||
      (key === "RELEASE_PERSON" && values["TwelveHour"] && !values["VI"] && values["vehicle_location"] === "private")
  ) {
    val = impoundLotOperators.find(x => x.name === values["ILO-name"])?.name_print || values["ILO-name"];
  }

  return val;
};

export const printCheckHelper = (
    values: Record<string, any>,
    data: { field_name: string; field_val?: string | string[] },
    key: string
): boolean => {
  // If value is boolean, return it directly
  if (typeof values[data.field_name] === "boolean") {
    return data.field_val === "false" ? !values[data.field_name] : values[data.field_name];
  }

  // If field_val is an array, check if the value exists in it
  if (Array.isArray(data.field_val) && data.field_val.includes(values[data.field_name])) {
    return true;
  }

  // If the value is a string, check for an exact match
  return values[data.field_name] === data.field_val;
};

// Error handler function
export const handleError = (error: string): void => {
  console.error("Error:", error);
};
