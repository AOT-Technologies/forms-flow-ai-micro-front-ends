import moment from 'moment'
import { DATE_FORMAT } from '../constants/constants'
import { TIME_FORMAT } from '../constants/constants'
import { MULTITENANCY_ENABLED } from "../constants/constants";
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

    const tenantKeyCheck = value.match(`${tenantKey}-`)?.[0];
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

}

export default HelperServices
