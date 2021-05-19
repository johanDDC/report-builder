/// <reference path="../types-ReportAPI.d.ts" />
namespace EndUserUtils {
  type primitive = string | number | boolean
  type rawJs = primitive | rawJs[] | {[key: string]: rawJs}

  export function reportCSV(data: {}[]);
  export function reportCSV(name: string, data: {}[]);
  export function reportCSV(nameOrData: string | any[], data?: {}[]) {
    let theName: string;
    let theData: {}[];
    if (typeof nameOrData === 'string') {
      theName = nameOrData;
      theData = data;
    } else {
      theName = undefined
      theData = nameOrData
    }

    function collectColumns(): string[] {
      const columnsSet = {}
      const columnsArray: string[] = []
      theData.forEach(row => {
        Object.getOwnPropertyNames(row).forEach(column => {
          if (typeof row[column] === 'function') return
          if (columnsSet[column] === undefined) {
            columnsSet[column] = true
            columnsArray.push(column)
          }
        })
      })
      return columnsArray
    }

    function convertMongoValue(value: any): rawJs {
      if (typeof value !== 'object') return undefined
      const ownPropertyNames = Object.getOwnPropertyNames(value);
      if (ownPropertyNames.length === 1) {
        if ('$oid' in value && typeof value.$oid === 'string') return value.$oid
        if ('$date' in value) {
          const d = value.$date
          if (typeof d === 'string') return convertKnownClass(new Date(d))
          if ('$numberLong' in d && typeof d.$numberLong === 'number') convertKnownClass(new Date(d.$numberLong))
          return undefined
        }
        if ('$numberDecimal' in value && typeof value.$numberDecimal === 'string') return value.$numberDecimal
      }
      return undefined
    }

    const DATE_FORMAT = new Intl.DateTimeFormat([], {dateStyle: 'short'} as any)
    const DATE_TIME_FORMAT = new Intl.DateTimeFormat([], {dateStyle: 'short', timeStyle: 'short'} as any)
    function convertKnownClass(value: any): rawJs {
      const constructor = value.constructor;
      if (constructor === Object) return undefined
      if (constructor === Date) {
        let date: Date = value
        let format: Intl.DateTimeFormat = DATE_TIME_FORMAT
        if (date.getSeconds() === 0 && date.getMilliseconds() === 0) {
          if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
            date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
            format = DATE_FORMAT
          }
          if (date.getHours() === 0 && date.getMinutes() === 0) format = DATE_FORMAT
        }
        return format.format(date)
      }
      throw Error(`Unsupported class '${constructor}' of value '${value}'`)
    }

    function convertValue(value: unknown): rawJs {
      if (value === null || value === undefined) return ''
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
      if (Array.isArray(value)) return value.map(convertValue)
      if (typeof value === 'object') {
        let converted = convertMongoValue(value);
        if (converted !== undefined) return converted
        converted = convertKnownClass(value)
        if (converted !== undefined) return converted
        const result: rawJs = {}
        Object.getOwnPropertyNames(value).forEach(prop => {
          result[prop] = convertValue(value[prop])
        })
        return result
      }
      throw Error('Unsupported value: ' + value)
    }

    function convertRow(columns: string[], row: {}): {[k:string]: primitive} {
      const result: {[k:string]: primitive} = {}
      columns.forEach(column => {
        let value = convertValue(row[column]);
        if (typeof value === 'object') value = JSON.stringify(value)
        result[column] = value;
      })
      return result
    }

    const columns = collectColumns()
    const convertedData = theData.map(row => convertRow(columns, row));
    env.table(convertedData, theName)
  }
}

const reportCSV = EndUserUtils.reportCSV

