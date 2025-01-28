import Dexie, { Table } from "dexie";

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

interface Event {
  event_id: number;
  driver_licence_no: string;
  date_of_driving: string;
  [key: string]: any; // Allow additional fields for complex structure
}

interface FormID {
  id: string;
  form_type: string;
  user_guid: string;
  leased: boolean;
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

interface IncompleteEvent {
  inc_event_id: number;
  driver_licence_no: string;
  [key: string]: any; // Allow additional fields for complex structure
}

// ToDO: check whether Event and IncompleteEvent is needed as the FE will be showing only the formsflow related forms and submision.

class DigitalFormsDB extends Dexie {
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
  event!: Table<Event>;
  formID!: Table<FormID>;
  vehicleTypes!: Table<VehicleType>;
  nscPuj!: Table<NSCPuj>;
  jurisdictionCountry!: Table<JurisdictionCountry>;
  incompleteEvent!: Table<IncompleteEvent>;

  constructor() {
    super("digitalForms");

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
      event:
        "event_id++,[driver_licence_no+date_of_driving], icbc_sent_status, driver_licence_no, driver_jurisdiction, driver_last_name, driver_given_name, driver_dob, driver_address, driver_city, driver_prov, driver_postal, driver_phone, vehicle_jurisdiction, vehicle_plate_no, vehicle_registration_no, vehicle_year, vehicle_mk_md, vehicle_style, vehicle_colour, vehicle_vin_no, nsc_prov_state, nsc_no, owned_by_corp, corporation_name, regist_owner_last_name, regist_owner_first_name, regist_owner_address, regist_owner_dob, regist_owner_city, regist_owner_prov, regist_owner_postal, regist_owner_phone, printed, sync_status, created_dt, updated_dt, created_by, updated_by , vehicle_impounded, reason_for_not_impounding, vehicle_released_to, date_released, time_released, location_of_keys, impound_lot_operator, type_of_prohibition, intersection_or_address_of_offence, offence_city, agency_file_no, date_of_driving, time_of_driving, reasonable_ground, reasonable_ground_other, prescribed_test_used, date_of_test, time_of_test, reason_for_not_using_prescribed_test, test_used_alcohol, asd_expiry_date, result_alcohol, bac_result_mg, test_used_drugs, test_result_drugs, IRP, VI, TwentyFourHour, TwelveHour, requested_prescribed_test, requested_test_used, time_of_requested_test, requested_ASD_expiry_date, requested_alcohol_test_result, requested_BAC_result, requested_approved_instrument_used, gender, driver_licence_expiry, driver_licence_class, unlicenced_prohibition_number, belief_driver_bc_resident, out_of_province_dl, out_of_province_dl_number, date_of_impound, irp_impound, irp_impound_duration, IRP_number, VI_number, excessive_speed, prohibited, suspended, street_racing, stunt_driving, motorcycle_seating, motorcycle_restrictions, unlicensed, linkage_location_of_keys, linkage_location_of_keys_explanation, linkage_driver_principal, linkage_owner_in_vehicle, linkage_owner_aware_possesion, linkage_vehicle_transfer_notice, linkage_other, speed_limit, vehicle_speed, speed_estimation_technique, speed_confirmation_technique",
      formID: "id, form_type, user_guid, leased, [form_type+leased]",
      vehicleTypes: "type_cd, description",
    });

    this.version(4).stores({
      nscPuj: "id, objectCd, objectDsc",
      jurisdictionCountry: "id, objectCd, objectDsc",
    });

    this.version(5).stores({
      incompleteEvent:
        "inc_event_id++, icbc_sent_status, driver_licence_no, driver_jurisdiction, driver_last_name, driver_given_name, driver_dob, driver_address, driver_city, driver_prov, driver_postal, driver_phone, vehicle_jurisdiction, vehicle_plate_no, vehicle_registration_no, vehicle_year, vehicle_mk_md, vehicle_style, vehicle_colour, vehicle_vin_no, nsc_prov_state, nsc_no, owned_by_corp, corporation_name, regist_owner_last_name, regist_owner_first_name, regist_owner_address, regist_owner_dob, regist_owner_city, regist_owner_prov, regist_owner_postal, regist_owner_phone, printed, sync_status, created_dt, updated_dt, created_by, updated_by , vehicle_impounded, reason_for_not_impounding, vehicle_released_to, date_released, time_released, location_of_keys, impound_lot_operator, type_of_prohibition, intersection_or_address_of_offence, offence_city, agency_file_no, date_of_driving, time_of_driving, reasonable_ground, reasonable_ground_other, prescribed_test_used, date_of_test, time_of_test, reason_for_not_using_prescribed_test, test_used_alcohol, asd_expiry_date, result_alcohol, bac_result_mg, test_used_drugs, test_result_drugs, IRP, VI, TwentyFourHour, TwelveHour, requested_prescribed_test, requested_test_used, time_of_requested_test, requested_ASD_expiry_date, requested_alcohol_test_result, requested_BAC_result, requested_approved_instrument_used, gender, driver_licence_expiry, driver_licence_class, unlicenced_prohibition_number, belief_driver_bc_resident, out_of_province_dl, out_of_province_dl_number, date_of_impound, irp_impound, irp_impound_duration, IRP_number, VI_number, excessive_speed, prohibited, suspended, street_racing, stunt_driving, motorcycle_seating, motorcycle_restrictions, unlicensed, linkage_location_of_keys, linkage_location_of_keys_explanation, linkage_driver_principal, linkage_owner_in_vehicle, linkage_owner_aware_possesion, linkage_vehicle_transfer_notice, linkage_other, speed_limit, vehicle_speed, speed_estimation_technique, speed_confirmation_technique",
    });
  }
}

// Initialize the database
export const db = new DigitalFormsDB();

// Open the database and clear formID for testing
const initDB = async () => {
  try {
    await db.open();
    await db.formID.clear();
    console.log("Form IDs cleared.");
    console.log("IndexedDB is open.");
  } catch (error) {
    console.error("Open failed: " + error);
  }
};

initDB();
