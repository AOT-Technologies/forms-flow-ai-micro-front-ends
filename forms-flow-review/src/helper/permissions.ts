import { StorageService } from "@formsflow/service";

export const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE) ?? "[]"
  );


export const createFilterPermission = userRoles.includes("create_filters");
export const isFilterAdmin = userRoles.includes("manage_all_filters");