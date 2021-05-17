declare const env: {
  query(query: {}, context: any, projection?: any, limit?: number, offset?: number, sort?: {})
  logInfo(text: string)
}

/** Defines MongoDB types */
export namespace Mongo {
  export type ObjectId = {$oid: string}

  export type MDecimal = { $numberDecimal: string }

  export type Date_str = { $date: string }
  export type Date_millis = { $date : { $numberLong: string }}
  export type Date = Date_str | Date_millis

  export class Decimal {
    readonly text: string

    constructor(value: Values.Decimal) {
      this.text = Decimal.extractTextFrom(value)
    }

    static extractTextFrom(value: Values.Decimal): string {
      if (typeof value === 'string') return value
      if (typeof value === 'number') return  '' + value
      if (typeof value === 'object') {
        if ('$numberDecimal' in value && typeof value.$numberDecimal === 'string') return value.$numberDecimal
        if ('text' in value && typeof value.text === 'string') return value.text
      }
      else throw Error('Not a number: ' + value)
    }

    get asNumber(): number {
      return parseFloat(this.text)
    }
  }
}

/** Defines supported simplified presentations of Mongo types */
export namespace Values {
  /**
   * ObjectId supports: native Mongo presentation, plain text ID (in hex form),
   * any object with the '_id' field (native ObjectId or plain text hex ID)
   */
  export type ObjectId = string | Mongo.ObjectId | {_id: string} | {_id: Mongo.ObjectId}

  export type Decimal = string | number | Mongo.MDecimal | Mongo.Decimal

  export type JDate = string | number | Date | Mongo.Date
}

/**
 * Defines type conversions from JS to Mongo
 */
export namespace Types {
  export type Type<J, M> = {
    toMongo(value: J): M
  }

  export const OBJECT_ID: Type<Values.ObjectId, Mongo.ObjectId> = {
    toMongo(value: Values.ObjectId): Mongo.ObjectId {
      if (typeof value === 'string') return {$oid: value}
      if (typeof typeof value === 'object') {
        if ('$oid' in value) {
          if (typeof value.$oid === 'string') return value;
        } else {
          if (typeof value._id === 'string') return {$oid: value._id}
          return value._id
        }
      }
      throw Error('Not an ObjectId: ' + value)
    }
  }

  export const STRING: Type<string, string> = {
    toMongo(value: string): string {
      if (typeof value === 'string') return value;
      throw Error('Not a string: ' + value)
    }
  }

  export const NUMBER: Type<number, number> = {
    toMongo(value: number): number {
      if (typeof value === "number") return value;
      throw Error('Not a number: ' + value)
    }
  }

  export const DECIMAL: Type<Values.Decimal, Mongo.MDecimal> = {
    toMongo(value: Values.Decimal): Mongo.MDecimal {
      return {$numberDecimal: Mongo.Decimal.extractTextFrom(value)}
    }
  }

  function toJsDate(value: Values.JDate): Date {
    const originalValue = value
    if (typeof value === 'string') value = parseToJsDate(value)
    if (typeof value === 'number') return new Date(value)
    if (typeof value === 'object') {
      if (value.constructor === Date) return value
      if ('$date' in value) {
        const $date = value.$date;
        if (typeof $date === 'string') return parseToJsDate($date)
        if ('$numberLong' in $date && typeof $date.$numberLong === 'string') return new Date(parseToInt($date.$numberLong))
      }
    }
    throw Error(`Not a date: '${originalValue}'`)
  }
  function parseToJsDate(text: string): Date {
    const epochMillis = Date.parse(text);
    if (isNaN(epochMillis)) throw Error(`Cannot parse date: '${text}'`)
    return new Date(epochMillis)
  }
  function parseToInt(text: string): number {
    const int = parseInt(text);
    if (isNaN(int)) throw Error(`Cannot parse integer: '${text}'`)
    return int
  }

  export const DATE_TIME: Type<Values.JDate, Mongo.Date> = {
    toMongo(value: Values.JDate): Mongo.Date {
      let date = toJsDate(value);
      return {$date: date.toISOString()}
    }
  }
  /**
   * This type rounds date to UTC midnight
   */
  export const DATE: Type<Values.JDate, Mongo.Date> = {
    toMongo(value: Values.JDate): Mongo.Date {
      let date = toJsDate(value);
      // Round the date to midnight.
      let takeLocal; // Use local (true) or UTC (false) time
      if (date.getHours() === 0 && date.getMinutes() === 0)  // Local TimeZone Midnight
        takeLocal = true;
      else if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) // Near UTC Midnight
        takeLocal = false;
      else if (date.getHours() === 0) takeLocal = true;
      else if (date.getUTCHours() === 0) takeLocal = false;
      else takeLocal = true;
      let [utcYear, utcMonth, utcDay] = takeLocal ?
          [date.getFullYear(), date.getMonth(), date.getDate()] // Move to UTC Midnight
          : [date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()];
      return {$date: new Date(Date.UTC(utcYear, utcMonth, utcDay)).toISOString()}
    }
  }
}

/**
 * Defines utilities for building Mongo queries
 */
export namespace Constraints {
  export type QueryBuilder<B extends QueryBuilder<B>> = {readonly $addConstraint: (filter: any) => B}

  export type QueryParams = {
    collection: string,
    filters: any[],
    limit?: number,
    offset?: number,
    projection?: any
  }

  export class BaseQueryBuilder<R, F extends string, B extends BaseQueryBuilder<R, F, B>> {
    constructor(readonly $params: Readonly<QueryParams>, protected readonly $new: (p: QueryParams) => B) {
    }

    $query(): R[] {
      const params = this.$params;
      return env.query({$and: params.filters}, params.collection, params.projection, params.limit, params.offset)
    }

    $limit(limit: number): B {
      return this.$new({...this.$params, limit})
    }

    $offset(offset: number): B {
      return this.$new({...this.$params, offset})
    }

    $projection(...includeFields: F[]): B {
      const projection: any = {}
      includeFields.forEach((f) => projection[f] = 1)
      return this.$new({...this.$params, projection})
    }
  }

  export function eqInConstraint<J, M, B extends QueryBuilder<B>>(builder: B, field: string, type: Types.Type<J, M>, eqIn: J[]): B {
    let constraint;
    if (eqIn.length === 0) throw Error(`Field ${field}: the equals constraint misses arguments`)
    if (eqIn.length === 1) constraint = {$eq: type.toMongo(eqIn[0])}
    else constraint = {$in: eqIn.map(id => type.toMongo(id))}
    const filter = {}
    filter[field] = constraint
    return builder.$addConstraint(filter)
  }

  export class ComparisonConstraintBuilder<J, M, B extends QueryBuilder<B>> {
    constructor(readonly builder: B, readonly field: string, readonly type: Types.Type<J, M>) {
    }

    greaterThan(lowInc: J, strict: boolean = false): B {
      return this.compareTo(lowInc, true, strict)
    }

    lessThan(highExc: J, strict: boolean = true): B {
      return this.compareTo(highExc, false, strict)
    }

    inRange(lowInc: J, highExc: J, lowStrict: boolean = false, highStrict: boolean = true): B {
      return this.builder.$addConstraint({$and: [
          this.cmpFilter(lowInc, true, lowStrict),
          this.cmpFilter(highExc, false, highStrict)
        ]})
    }

    compareTo(value: J, greaterThan: boolean, strict: boolean = false): B {
      const filter = this.cmpFilter(value, greaterThan, strict);
      return this.builder.$addConstraint(filter)
    }

    private cmpFilter(value: J, greater: boolean, strict: boolean) {
      const op = greater ?
          (strict ? '$gt' : '$gte')
          : (strict ? '$lt' : '$lte');
      const constraint = {[op]: this.mongoValue(value)};
      return {[this.field]: constraint};
    }

    private mongoValue(value: J): M {
      const mValue = this.type.toMongo(value)
      if (mValue === null || mValue === undefined) throw Error(`Comparison constraint on field '${this.field} does not support nulls (${value})`)
      return mValue;
    }
  }
}
