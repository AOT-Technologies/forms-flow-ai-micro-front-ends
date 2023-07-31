import moment from 'moment'

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
    ).format(`${dateFormat}, ${timeFormat}`)
  }

  public static getLocaldate(date: string, format: string): any {
    if (!date) {
      return '-'
    }
    const dateTimeString = date
      ? new Date(date.replace(' ', 'T') + 'Z').toLocaleString()
      : '-'
    const dateTime = moment(dateTimeString)
    const localDate = dateTime.format(format)
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
    const localTime = dateTime.format(format)
    return localTime
  }
}

export default HelperServices;
