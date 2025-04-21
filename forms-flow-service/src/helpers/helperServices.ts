import moment from 'moment'
import { DATE_FORMAT ,MULTITENANCY_ENABLED ,TIME_FORMAT} from '../constants/constants';

class HelperServices {
  public static getLocalDateAndTime(date: string): any {
    if (!date) {
      return '-'
    }
    // Parse the input date string as a moment.js object
    const momentDate = moment.utc(date?.replace(' ', 'T'));

    // Convert localizedDateTime to a Moment.js object and format it with the same format
    const localizedDateTime = moment(momentDate?.toDate())
      .format(`${DATE_FORMAT}, ${TIME_FORMAT}`)
      .toLocaleString()
    return localizedDateTime
  }

  public static getLocaldate(date: string): any {
    if (!date) {
      return '-'
    }
    const momentDate = moment.utc(date?.replace(' ', 'T'));

    const localizedDate = moment(momentDate?.toDate())
      .format(DATE_FORMAT)
      .toLocaleString();
    return localizedDate;
  }

  public static getLocalTime(date: string): any {
    if (!date) {
      return '-'
    }

    const momentDate = moment.utc(date?.replace(' ', 'T')); 
    const localizedTime = moment(momentDate?.toDate())
      .format(TIME_FORMAT)
      .toLocaleString();
    return localizedTime;
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

    const tenantKeyCheck = new RegExp(`${tenantKey}-`).exec(value)?.[0]
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

  public static isViewOnlyRoute(location: string, routes: Set<string>): boolean {
    return Array.from(routes).some((route) => location.includes(route));
  }

  // Method to check if the current route matches the routes where sidebar shouldnt be shown
  public static hideSideBarRoute(location: string): boolean {
    const previewRouteParts = ["formflow","view-edit"]; // Route parts which is part of designer preview page
    const exactRouteMatches = ["/","/tenant"]; // Exact Routes where sidebar is not required
    const partOfRouteMatches = ["/public/"]; // Parts of Routes where sidebar is not required . 

    return (
      previewRouteParts.every((route) => location.includes(route)) || 
      exactRouteMatches.some((route) => location == route) || 
      partOfRouteMatches.some((route) => location.includes(route))
    );
  } 

  public static getResetSortOrders(options){
    return options.reduce((acc, option) => {
      acc[option.value] = {sortOrder:"asc"} // Reset all to ascending
      return acc;
    }, {});
  }
}

export default HelperServices
