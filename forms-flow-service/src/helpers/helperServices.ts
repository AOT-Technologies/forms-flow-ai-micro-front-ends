import moment from "moment";
import {
  DATE_FORMAT,
  MULTITENANCY_ENABLED,
  TIME_FORMAT,
} from "../constants/constants";

class HelperServices {
  // Parse a "YYYY-MM-DD HH:mm:ss" / ISO string as UTC and convert to local
  // time in ONE moment instance (S.19). Output is identical to the previous
  // moment(moment.utc(x).toDate()) double-instance pattern.
  private static toLocalMoment(date: string) {
    return moment.utc(date.replace(" ", "T")).local();
  }

  public static getISODateTime(date: any): string | null {
    if (date) {
      return moment(date).format("YYYY-MM-DDTHH:mm:ss.SSSZZ"); // strict ISO with colon
    }
    return null;
  }

  public static getLocalDateAndTime(date: string): any {
    if (!date) {
      return null;
    }
    // Format as DD-MMM-YYYY, h:mm a
    return HelperServices.toLocalMoment(date).format(
      `${DATE_FORMAT}, ${TIME_FORMAT}`
    );
  }

  public static getLocaldate(date: string): any {
    if (!date) {
      return null;
    }
    // Format as DD-MMM-YYYY (e.g., 07-Feb-2025)
    return HelperServices.toLocalMoment(date).format(DATE_FORMAT);
  }

  public static getShortDateAndTime(date: string): string | null {
    if (!date) return null;
    const m = HelperServices.toLocalMoment(date);
    return `${m.format("DD/MM/YY")} ${m.format(TIME_FORMAT)}`;
  }

  public static getLocalTime(date: string): any {
    if (!date) {
      return null;
    }
    // Format as h:mm a (e.g., 3:45 PM)
    return HelperServices.toLocalMoment(date).format(TIME_FORMAT);
  }

  public static getMoment(date: any): any {
    return moment(date);
  }

  //  method to remove tenant key
  public static removeTenantKeyFromData(
    value: string,
    tenantKey: string
  ): string {
    if (!value || !tenantKey) {
      return value;
    }

    const tenantKeyCheck = new RegExp(`${tenantKey}-`).exec(value)?.[0];
    const startWithSlash = value.startsWith("/");

    if (
      MULTITENANCY_ENABLED &&
      tenantKey &&
      tenantKeyCheck?.toLowerCase() === `${tenantKey.toLowerCase()}-`
    ) {
      return value.replace(
        `${startWithSlash ? "/" : ""}${tenantKey.toLowerCase()}-`,
        ""
      );
    }
    return value;
  }

  public static isViewOnlyRoute(
    location: string,
    routes: Set<string>
  ): boolean {
    return Array.from(routes).some((route) => location.includes(route));
  }

  // Method to check if the current route matches the routes where sidebar shouldnt be shown
  public static hideSideBarRoute(location: string): boolean {
    const previewRouteParts = ["formflow", "view-edit"]; // Route parts which is part of designer preview page
    const exactRouteMatches = ["/", "/tenant", "/onboarding"]; // Exact Routes where sidebar is not required
    const partOfRouteMatches = ["/public/"]; // Parts of Routes where sidebar is not required .

    return (
      previewRouteParts.every((route) => location.includes(route)) ||
      exactRouteMatches.some((route) => location == route) ||
      partOfRouteMatches.some((route) => location.includes(route))
    );
  }

  public static getResetSortOrders(options) {
    return options.reduce((acc, option) => {
      acc[option.value] = { sortOrder: "asc" }; // Reset all to ascending
      return acc;
    }, {});
  }

  // Method to remove tenant name from role strings when multitenancy is enabled
  public static removeTenantFromRoles(
    rolesString: string,
    tenantKey: string
  ): string {
    if (!rolesString || !tenantKey || !MULTITENANCY_ENABLED) {
      return rolesString;
    }

    const tenantPrefix = `${tenantKey}-`;
    return rolesString
      .split(", ")
      .map((role) =>
        role.startsWith(tenantPrefix)
          ? role.substring(tenantPrefix.length)
          : role
      )
      .join(", ");
  }
}

export default HelperServices;
