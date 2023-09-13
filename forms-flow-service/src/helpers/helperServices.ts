import moment from 'moment'
import { DATE_FORMAT } from '../constants/constants'
import { TIME_FORMAT } from '../constants/constants'

class HelperServices {
  public static getLocalDateAndTime(date: string): any {
    if (!date) {
      return '-'
    }
    // Parse the input date string as a moment.js object
    const momentDate = moment(date?.replace(' ', 'T'))

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
    const momentDate = moment(date?.replace(' ', 'T'));

    const localizedDate = moment(momentDate?.toDate())
      .format(DATE_FORMAT)
      .toLocaleString();
    return localizedDate;
  }

  public static getLocalTime(date: string): any {
    if (!date) {
      return '-'
    }

    const momentDate = moment(date?.replace(' ', 'T'));
    const localizedTime = moment(momentDate?.toDate())
      .format(TIME_FORMAT)
      .toLocaleString();
    return localizedTime;
  }
}

export default HelperServices
