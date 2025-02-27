// constants
export const StaticResources = [
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

  export const StaticTables = [
    'vehicles',
    'vehicleStyles',
    'vehicleColours',
    'provinces',
    'jurisdictions',
    'impoundLotOperators',
    'countries',
    'cities',
    'agencies',
    'vehicleTypes',
    'nscPuj',
    'jurisdictionCountry'
  ];

  export const FormTypes = ["12Hour", "24Hour", "VI"];

  export const TableMetadataMapping = Object.freeze({
    formList: { metadataTable: "formListMetaData", dataKey: "forms" },
    application: { metadataTable: "applicationMetaData", dataKey: "applications" },
    draft: { metadataTable: "draftMetaData", dataKey: "drafts" }
  });