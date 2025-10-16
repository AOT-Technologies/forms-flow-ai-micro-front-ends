import Dexie, { Table } from "dexie";

// Below are RSBC (RoadSafetyBC) specific interfaces
// These define the structure of various objects stored in IndexedDB
interface User {
  user_guid: string;
  business_guid: string;
  username: string;
  agency: string;
  badge_number: string;
  last_name: string;
  first_name: string;
  display_name: string;
  login: string;
}

interface UserRole {
  user_guid: string;
  role_name: string;
  submitted_dt: string;
  approved_dt?: string;
}

interface Vehicle {
  id: string;
  mk: string;
  search: string;
  md: string;
}

interface VehicleStyle {
  code: string;
  name: string;
}

interface VehicleColour {
  code: string;
  display_name: string;
  colour_class: string;
}

interface Province {
  id: string;
  objectCd: string;
  objectDsc: string;
}

interface Jurisdiction {
  id: string;
  objectCd: string;
  objectDsc: string;
}

interface ImpoundLotOperator {
  id: string;
  name: string;
  lot_address: string;
  city: string;
  phone: string;
  name_print: string;
}

interface Country {
  id: string;
  objectCd: string;
  objectDsc: string;
}

interface City {
  id: string;
  objectCd: string;
  objectDsc: string;
}

interface Agency {
  id: string;
  vjur: string;
  agency_name: string;
}

interface FormID {
  id: string;
  form_type: string;
  user_guid: string;
  leased: boolean;
  lease_expiry: string;
  printed_timestamp: string;
  spoiled_timestamp: string;
  last_updated: string;
}

interface VehicleType {
  type_cd: string;
  description: string;
}

interface NSCPuj {
  id: string;
  objectCd: string;
  objectDsc: string;
}

interface JurisdictionCountry {
  id: string;
  objectCd: string;
  objectDsc: string;
}

interface LKIHighway {
  code: string;
  description: string;
  letter: string;
  number: number;
}

interface LKISegment {
  code: string;
  description: string;
  direction: string;
  hwy_code: string;
  length: number;
}

interface ChargeType {
  id: number;
  code: string;
  statuteCode: string;
  description: string;
}

// Database class extending Dexie to manage IndexedDB storage
class DigitalFormsDB extends Dexie {
  // Declaring tables with their respective interfaces
  user!: Table<User>;
  userRoles!: Table<UserRole>;
  vehicles!: Table<Vehicle>;
  vehicleStyles!: Table<VehicleStyle>;
  vehicleColours!: Table<VehicleColour>;
  provinces!: Table<Province>;
  jurisdictions!: Table<Jurisdiction>;
  impoundLotOperators!: Table<ImpoundLotOperator>;
  countries!: Table<Country>;
  cities!: Table<City>;
  agencies!: Table<Agency>;
  formID!: Table<FormID>;
  vehicleTypes!: Table<VehicleType>;
  nscPuj!: Table<NSCPuj>;
  jurisdictionCountry!: Table<JurisdictionCountry>;
  lkiHighway!: Table<LKIHighway>;
  lkiSegment!: Table<LKISegment>;
  chargeTypes!: Table<ChargeType>;

  constructor() {
    super("digitalFormsFF");

    // Database schema definitions
    //if you need to change any of these definitions add a new version below instead of changing the current one. If there is a change that
    //requires a migration you need to add a .upgrade(() => {}) to the end of the version to handle how the data is migrated.

    this.version(3).stores({
      user: "user_guid, business_guid, username, agency, badge_number, last_name, first_name, display_name, login",
      userRoles:
        "[user_guid+role_name], user_guid, role_name, submitted_dt, approved_dt",
      vehicles: "id, mk, search, md",
      vehicleStyles: "code, name",
      vehicleColours: "code, display_name, colour_class",
      provinces: "id, objectCd, objectDsc",
      jurisdictions: "id, objectCd, objectDsc",
      impoundLotOperators: "id, name, lot_address, city, phone, name_print",
      countries: "id, objectCd, objectDsc",
      cities: "id, objectCd, objectDsc",
      agencies: "id, vjur, agency_name",
      formID:
        "id, form_type, leased, [form_type+leased], last_updated, user_guid",
      vehicleTypes: "type_cd, description",
    });

    this.version(4).stores({
      nscPuj: "id, objectCd, objectDsc",
      jurisdictionCountry: "id, objectCd, objectDsc",
    });

    this.version(5).stores({
      lkiHighway: "code, description, letter, number",
      lkiSegment: "code, description, direction, hwy_code, length",
    });

    this.version(6).stores({
      chargeTypes: "id, code, statuteCode, description"
    })
  }
}

// Initialize the database
export const rsbcDb = new DigitalFormsDB();

// Open the database
const initDB = async () => {
  try {
    if (!rsbcDb.isOpen()) {
      await rsbcDb.open();
      console.log("IndexedDB is open.");
    } else {
      console.log("IndexedDB is already open.");
    }
  } catch (error) {
    console.error("Open failed: " + error);
  }
};

initDB();
