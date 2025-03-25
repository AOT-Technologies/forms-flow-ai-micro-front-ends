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

// Error handler function
export const handleError = (error: string): void => {
  console.error("Error:", error);
};

export const printFormatHelper = (
  values: Values,
  data: DataEntry,
  key: string,
  impoundLotOperators: ImpoundLotOperator[]
): string => {
  if (key in fieldsToSplit) {
    return handleSplitField(
      values[data.field_name],
      fieldsToSplit[key],
      data.delimeter,
      data.field_name
    );
  }

  if (Array.isArray(data.field_name)) {
    return formatMultipleFields(data.field_name, values, key);
  }

  return processFieldValue(values, data, key, impoundLotOperators);
};

const handleSplitField = (
  rawValue: any,
  index: number,
  delimiter = " ",
  field_name: any
) => {
  if (!rawValue) return "";
  let splitData: string[] = [];
  if (typeof rawValue === "object" && rawValue.value) {
    if (typeof rawValue.value !== "string") {
      console.error(
        `Error: Expected string in rawValue.value in field_name "${field_name}" but got`,
        rawValue.value
      );
    }
    splitData = rawValue.value.split(delimiter);
  } else if (typeof rawValue === "string") {
    splitData = rawValue.split(delimiter);
  }
  return splitData.length ? splitData[index] || "" : "";
};

const formatMultipleFields = (
  fields: string[],
  values: Values,
  key: string
): string => {
  const formattedValues = fields.map((field) =>
    formatFieldValue(field, values[field])
  );
  let result = formattedValues.filter(Boolean).join(", ");

  if (key === "DL_SURRENDER_LOCATION") result += ", BC";
  if (key === "OWNER_NAME" && values["owned_by_corp"]) {
    result = values["corporation_name"];
  }
  return result;
};

const formatFieldValue = (field: string, fieldValue: any): string => {
  if (!fieldValue) return "";
  if (typeof fieldValue === "object" && fieldValue !== null) {
    const isValidValue =
      typeof fieldValue.value === "string" ||
      Array.isArray(fieldValue.value) ||
      ArrayBuffer.isView(fieldValue.value);
    if (!isValidValue) {
      console.error(
        `Error: fieldValue.value is not a valid type (string, array, or typed array) for field "${field}".`,
        fieldValue
      );
    }

    if (field === "driver_prov_state") {
      return fieldValue.value.includes("_")
        ? fieldValue.value.split("_")[1]
        : fieldValue.value;
    }
    return (
      fieldValue.label ||
      (fieldValue.value.includes("_")
        ? fieldValue.value.split("_")[1]
        : fieldValue.value)
    );
  }
  return fieldValue;
};

const processFieldValue = (
  values: Values,
  data: DataEntry,
  key: string,
  impoundLotOperators: ImpoundLotOperator[]
): string => {
  let val = values[data.field_name];

  if (data.barcode) return `*${String(val).slice(2)}*`;
  if (moment(values[data.field_name], moment.ISO_8601, true).isValid())
    return moment(values[data.field_name]).format(
      data.date_val || "YYYY-MM-DD"
    );
  if (Array.isArray(values[data.field_name]))
    return values[data.field_name].join("");
  if (["DRIVER_DL_EXPIRY", "REPORT_DRIVER_DL_EXPIRY"].includes(key))
    return moment(val).format("YYYY");
  if (typeof val === "object" && val !== null)
    return extractObjectValue(val, key, data.field_name);

  return formatReleaseInformation(values, key, val, impoundLotOperators);
};

const extractObjectValue = (
  fieldValue: any,
  key: string,
  field_name: any
): string => {
  if (key === "LOCATION_CITY") return fieldValue?.label || "";
  let val = fieldValue?.value || "";
  const isValidValue =
    typeof val === "string" || Array.isArray(val) || ArrayBuffer.isView(val);
  if (!isValidValue) {
    console.error(
      `Error: val is not a valid type (string, array, or typed array) for field "${field_name}".`,
      val
    );
  }
  return val.includes("_") ? val.split("_")[1] : val;
};

const formatReleaseInformation = (
  values: Values,
  key: string,
  val: string,
  impoundLotOperators: ImpoundLotOperator[]
): string => {
  let released_val = "";
  if (values["TwelveHour"]) {
    released_val = "vehicle_location";
  } else if (values["TwentyFourHour"]) {
    released_val = "reason_for_not_impounding";
  }

  if (["NOT_IMPOUNDED_REASON", "RELEASE_LOCATION_VEHICLE"].includes(key)) {
    if (
      key === "RELEASE_LOCATION_VEHICLE" &&
      (values["VI"] ||
        (values["TwentyFourHour"] && values["vehicle_impounded"] === "YES"))
    ) {
      return "IMPOUNDED";
    }
    return (
      {
        released: "RELEASED TO OTHER DRIVER",
        private: "PRIVATE TOW",
        roadside: "LEFT AT ROADSIDE",
        investigation: "SEIZED FOR INVESTIGATION",
      }[values[released_val]] || ""
    );
  }

  if (key === "RELEASE_PERSON")
    return determineReleasePerson(values, released_val);
  if (["IMPOUND_LOT_NAME", "IMPOUNDED_LOT"].includes(key))
    return (
      impoundLotOperators.find((x) => x.name === values["ILO-name"])
        ?.name_print || values["ILO-name"]
    );
  return val;
};

const determineReleasePerson = (
  values: Values,
  released_val: string
): string => {
  if (
    values["VI"] ||
    (values["TwentyFourHour"] && values["vehicle_impounded"] === "YES")
  )
    return "";
  if (values[released_val] === "released") {
    return values["vehicle_released_to"];
  } else if (values[released_val] === "private") {
    return values["ILO-name"];
  } else {
    return "";
  }
};

export const printCheckHelper = (
  values: Record<string, any>,
  data: { field_name: string; field_val?: string | string[] },
  key: string
): boolean => {
  if (typeof values[data.field_name] === "boolean") {
    return data.field_val === "false"
      ? !values[data.field_name]
      : values[data.field_name];
  }
  if (Array.isArray(data.field_val)) {
    return data.field_val.includes(values[data.field_name]);
  }
  return values[data.field_name] === data.field_val;
};
