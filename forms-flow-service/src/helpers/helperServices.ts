import moment from 'moment'
import { DATE_FORMAT } from '../constants/constants'
import { TIME_FORMAT } from '../constants/constants'

class HelperServices {

  public static getLocalDateAndTime(
    date: string,
    dateFormat: string,
    timeFormat: string,
  ): any {
    if (!date) {
      return '-'
    }
    return moment(
      new Date(date.replace(' ', 'T') + 'Z').toLocaleString(),
    ).format(`${DATE_FORMAT}, ${TIME_FORMAT}`)
  }

  public static getLocaldate(date: string, format: string): any {
    if (!date) {
      return '-'
    }
    const dateTimeString = date
      ? new Date(date.replace(' ', 'T') + 'Z').toLocaleString()
      : '-'
    const dateTime = moment(dateTimeString)
    const localDate = dateTime.format(DATE_FORMAT)
    return localDate
  }

  public static getLocalTime(date: string, format: string): any {
    if (!date) {
      return '-'
    }
    const dateTimeString = date
      ? new Date(date.replace(' ', 'T') + 'Z').toLocaleString()
      : '-'
    const dateTime = moment(dateTimeString)
    const localTime = dateTime.format(TIME_FORMAT)
    return localTime
  }
}

export default HelperServices;
