# forms-flow-rsbcservice

This is a utility module which exposes the following services across all modules
 - `DBService`

## 1. DBService
   
| Method    | Description | Parameters| 
| -------- | ------- | ------- |
| fetchAndSaveStaticData  | Fetch and save static data to IndexedDB |
| fetchStaticDataFromTable | Fetch data from IndexedDB Object Storage | `tableName` - ObjectStorage/Table name to fetch data |

## 2. RSBCImage (Custom Form.io Component)

The `RSBCImage` is a custom Form.io component designed to render specific RSBC images based on form submission data.

### Key Features
- Dynamic image rendering based on submission data
- Supports multiple stages (Stage One or Stage Two)

### Usage
To integrate the `RSBCImage` component in your form:

1. Add the `RSBCImage` component via the Form Builder.
2. Make sure that submission form data are the expected ones.  See below example of expected submission data.
3. When adding or editing the `RSBCImage` component, you must choose the "RSBC Printing Stage". This should be set to either "Stage One" or "Stage Two" based on the form's requirements.

### Expected Submission Data
The `RSBCImage` component requires specific data structures to render images effectively. Below are example JSON structures demonstrating the expected input:

#### Example 1: VI and 24-Hour Forms at Stage Two Submission
```json
{
    "VI": true,
    "TwelveHour": false,
    "TwentyFourHour": true,
    "IRP": false,
    "driver_licence_no": "",
    "drivers_licence_jurisdiction": {
        "value": "CA_BC",
        "label": "BRITISH COLUMBIA"
    },
    "driver_last_name": "DOE",
    "driver_given_name": "JOHN",
    "driver_dob": "",
    "driver_address": "891 HOCKLEY AVENUE",
    "driver_phone": "250-123-4567",
    "driver_city": "VICTORIA",
    "driver_prov_state": {
        "label": "BRITISH COLUMBIA",
        "value": "CA_BC"
    },
    "driver_postal": "V9B2V5",
    "gender": {},
    "driver_licence_expiry": null,
    "driver_licence_class": "",
    "vehicle_jurisdiction": {
        "value": "CA_BC",
        "label": "BRITISH COLUMBIA"
    },
    "vehicle_plate_no": "",
    "vehicle_registration_no": "",
    "vehicle_year": {
        "value": 2020,
        "label": "2020"
    },
    "vehicle_mk_md": {
        "label": "A C (GREAT BRITAIN)",
        "value": "AC-"
    },
    "vehicle_style": {
        "label": "3-DOOR HATCH",
        "value": "3DR"
    },
    "vehicle_colour": [
        "BLU"
    ],
    "vehicle_vin_no": "ABCDEFGHIJKLMNOPQRS",
    "nsc_prov_state": null,
    "nsc_no": "",
    "owned_by_corp": false,
    "driver_is_regist_owner": true,
    "regist_owner_last_name": "DOE",
    "regist_owner_first_name": "JOHN",
    "regist_owner_dob": "",
    "corporation_name": "",
    "regist_owner_address": "891 HOCKLEY AVENUE",
    "regist_owner_phone": "250-123-4567",
    "regist_owner_email": "",
    "regist_owner_city": "VICTORIA",
    "regist_owner_prov_state": {
        "label": "BRITISH COLUMBIA",
        "value": "CA_BC"
    },
    "regist_owner_postal": "V9B2V5",
    "date_of_impound": "2025-01-24",
    "vehicle_impounded": "YES",
    "reason_for_not_impounding": "",
    "vehicle_released_to": "",
    "date_released": null,
    "time_released": "",
    "location_of_keys": "WITH DRIVER",
    "ILO-name": "ASDFASDF",
    "ILO-address": "777 HOCKLEY AVENUE",
    "ILO-city": "VICTORIA",
    "ILO-phone": "250-123-4567",
    "ILO-options": {},
    "type_of_prohibition": "alcohol",
    "intersection_or_address_of_offence": "891 HOCKLEY AVENUE",
    "offence_city": {
        "label": "VICTORIA",
        "value": "VCTA"
    },
    "agency_file_no": "test43211",
    "date_of_driving": "2025-01-24",
    "time_of_driving": "09:00",
    "irp_impound": "",
    "irp_impound_duration": "",
    "IRP_number": "",
    "VI_number": 221100217,
    "excessive_speed": true,
    "prohibited": false,
    "suspended": false,
    "street_racing": false,
    "stunt_driving": false,
    "motorcycle_seating": false,
    "motorcycle_restrictions": false,
    "unlicensed": false,
    "speed_limit": "40",
    "vehicle_speed": "90",
    "speed_estimation_technique": "VISUAL",
    "speed_confirmation_technique": "LASER",
    "unlicenced_prohibition_number": "",
    "belief_driver_bc_resident": "",
    "out_of_province_dl": "",
    "out_of_province_dl_number": "",
    "out_of_province_dl_jurisdiction": null,
    "out_of_province_dl_expiry": null,
    "linkage_location_of_keys": false,
    "linkage_location_of_keys_explanation": "",
    "linkage_driver_principal": false,
    "linkage_owner_in_vehicle": false,
    "linkage_owner_aware_possesion": false,
    "linkage_vehicle_transfer_notice": false,
    "linkage_other": false,
    "incident_details_extra_page": false,
    "incident_details_explained_below": false,
    "incident_details": "",
    "witnessed_by_officer": true,
    "admission_by_driver": false,
    "independent_witness": false,
    "reasonable_ground_other": false,
    "reasonable_ground_other_reason": "",
    "prescribed_test_used": "YES",
    "reasonable_date_of_test": "2025-01-24",
    "reasonable_time_of_test": "09:10",
    "reason_for_not_using_prescribed_test": "",
    "resonable_test_used_alcohol": "alco-sensor",
    "reasonable_test_used_drugs": "",
    "reasonable_asd_expiry_date": "2025-01-31",
    "reasonable_result_alcohol": "FAIL",
    "reasonable_bac_result_mg": null,
    "resonable_approved_instrument_used": "",
    "reasonable_can_drive_drug": false,
    "reasonable_can_drive_alcohol": false,
    "officer-lastname": "John",
    "officer-prime-id": "test123",
    "officer-agency": "test agency",
    "vehicle_location": "",
    "confirmation_of_service_date": "2025-01-25T00:26:20.000Z",
    "document_served": "YES",
    "confirmation_of_service": true,
    "requested_prescribed_test": "",
    "requested_test_used_alcohol": "",
    "requested_test_used_drug": "",
    "time_of_requested_test": "",
    "requested_ASD_expiry_date": null,
    "requested_alcohol_test_result": "",
    "requested_BAC_result": null,
    "requested_approved_instrument_used": "",
    "requested_can_drive_drug": false,
    "requested_can_drive_alcohol": false,
    "is_nsc": false,
    "ecos_confirmed": true,
    "form_printed_successfully": true,
    "twenty_four_hour_number": "VZ110018"
}
```


#### RSBC Image Settings
If the data structure varies, the `RSBCImage` component includes an `“RSBCImage Settings”` section, allowing you to configure and map different data structures.
This ensures flexibility in handling various data formats while maintaining seamless integration. Sample on this is below

```json
{
    "TwentyFourHour": "form1.data.twentyFourHour",
    "drivers_licence_jurisdiction": {
        "mapping": {
            "value": "form2.drivers_licence_jurisdiction_value",
            "label": "form2.drivers_licence_jurisdiction_label"
        }
    },
    "gender": { "default": {} },
    "driver_licence_expiry": { "default": null },
    "driver_licence_class": { "default": "A" },
    "vehicle_colour": {
        "mapping": {
            "0": "form1.vehicleColours"
        }
    }
}
```