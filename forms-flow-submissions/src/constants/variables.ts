export interface SystemVariable {
  altVariable: string;
  labelOfComponent: string;
  type: 'hidden'; // narrow to only valid values
  key: string;
}
export const SystemVariables:SystemVariable[] = [
  {
    "altVariable": "",
    "labelOfComponent": "Current User",
    "type": "hidden",
    "key": "currentUser"
  },
  {
    "altVariable": "",
    "labelOfComponent": "Submitter Email",
    "type": "hidden",
    "key": "submitterEmail"
  },
  {
    "altVariable": "",
    "labelOfComponent": "Submitter First Name",
    "type": "hidden",
    "key": "submitterFirstName"
  },
  {
    "altVariable": "",
    "labelOfComponent": "Submitter Last Name",
    "type": "hidden",
    "key": "submitterLastName"
  },
  {
    "altVariable": "",
    "labelOfComponent": "Current User Roles",
    "type": "hidden",
    "key": "currentUserRoles"
  }
];