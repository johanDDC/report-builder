import * as Code from "./code"
import * as Schema from "./schema"

export type PrimitiveDescriptor = {
  /**
   * Generates a single method for a field of primitive type of a QueryBuilder
   */
  generate: (queryBuilder: Code.Builder, builderName: string, field: string) => void
  /** Defines type of record field (returned by a query) */
  jsType: string
}
/**
 * Describes all supported primitive types: [typeAlias -> descriptor].
 * The typeAlias here is the {@link Schema.Type} (which is a string for primitives)
 */
export type PrimitiveTypes = { [field: string]: PrimitiveDescriptor }

export const DEFAULT_ID_FIELD: PrimitiveDescriptor = {
  generate(queryBuilder, builderName, field) {
    queryBuilder.appendBlock(`${field}(id: string, ...ids: string[]): ${builderName} {`, '}')
        .appendLine(`return Util.Constraints.eqInConstraint<string, string, ${builderName}>(this, '${field}', Util.Types.STRING, [id, ...ids])`)
  },
  jsType: 'string'
}

export const DEFAULT_NUMBER_FIELD: PrimitiveDescriptor = {
  generate(queryBuilder, builderName, field) {
    queryBuilder.appendBlock(`get ${field}(): Util.Constraints.ComparisonConstraintBuilder<number, number, ${builderName}> {`, '}')
        .appendLine(`return new Util.Constraints.ComparisonConstraintBuilder<number, number, ${builderName}>(this, '${field}', Util.Types.NUMBER)`)
  },
  jsType: 'number'
}

export const DEFAULT_DECIMAL_FIELD: PrimitiveDescriptor = {
  generate(queryBuilder, builderName, field) {
    queryBuilder.appendBlock(`get ${field}(): Util.Constraints.ComparisonConstraintBuilder<Util.Values.Decimal, Util.Mongo.MDecimal, ${builderName}> {`, '}')
        .appendLine(`return new Util.Constraints.ComparisonConstraintBuilder<Util.Values.Decimal, Util.Mongo.MDecimal, ${builderName}>(this, '${field}', Util.Types.DECIMAL)`)
  },
  jsType: 'Util.Mongo.MDecimal'
}

export const DEFAULT_STRING_FIELD: PrimitiveDescriptor = {
  generate(queryBuilder, builderName, field) {
    queryBuilder.appendBlock(`get ${field}(): Util.Constraints.ComparisonConstraintBuilder<string, string, ${builderName}> {`, '}')
        .appendLine(`return new Util.Constraints.ComparisonConstraintBuilder<string, string, ${builderName}>(this, '${field}', Util.Types.STRING)`)
  },
  jsType: 'string'
}


export function createDefaultDateField(type: "DATE" | "DATE_TIME"): PrimitiveDescriptor {
  return {
    generate: (queryBuilder, builderName, field) => {
      const resultClass = `Util.Constraints.ComparisonConstraintBuilder<Util.Values.JDate, Util.Mongo.Date, ${builderName}>`
      queryBuilder.appendBlock(`get ${field}(): ${resultClass} {`, '}')
          .appendLine(`return new ${resultClass}(this, '${field}', Util.Types.${type})`)
    },
    jsType: 'Util.Mongo.Date_str'
  }
}

export function defaultEnumFieldGenerator(queryBuilder: Code.Builder, builderName: string, field: string, options: string[]) {
  if (options.length === 0) DEFAULT_ID_FIELD.generate(queryBuilder, builderName, field)
  else {
    const enumType = generateEnumOptions(options)
    queryBuilder.appendBlock(`${field}(...options: (${enumType})[]): ${builderName} {`, '}')
        .appendLine(`return Util.Constraints.eqInConstraint<string, string, ${builderName}>(this, '${field}', Util.Types.STRING, options)`)
  }
}

export type Settings = {
  primitives: PrimitiveTypes
  enum: (queryBuilder: Code.Builder, builderName: string, field: string, options: string[]) => void
}

export function defineQueryBuilder(code: Code.Builder, className: string, slice: Schema.Slice, settings: Settings) {
  const builder = code.appendBlock(`export class ${className} extends Util.Constraints.BaseQueryBuilder<Record, Field, ${className}> implements Util.Constraints.QueryBuilder<${className}> {`, '}');
  builder.appendLine('public readonly $addConstraint')
  builder.appendBlock('constructor(params: Util.Constraints.QueryParams) {', '}')
      .appendLine(`super(params, p => new ${className}(p))`)
      .appendLine('this.$addConstraint = (filter) => this.$new({...this.$params, filters: [...this.$params.filters, filter]})')
  Schema.accept(slice.element, {
    primitive(field: string, type: string) {
      const typeDefinition = settings.primitives[type];
      if (typeDefinition) typeDefinition.generate(builder, className, field)
    },
    enum(field: string, options: string[]) {
      settings.enum(builder, className, field, options)
    }
  })
}

export function defineRecordType(code: Code.Builder, type: Schema.ObjectType, primitives: PrimitiveTypes) {
  Schema.accept(type, {
    primitive(field: string, type: string) {
      const primitive = primitives[type];
      if (!primitive) return
      code.appendLine(`${field}: ${primitive.jsType}`)
    },
    enum(field: string, options: string[]) {
      let fieldType;
      if (options.length === 0) fieldType = 'string'
      else fieldType = generateEnumOptions(options)
      code.appendLine(`${field}: ${fieldType}`)
    }
  })
}

export function generateEnumOptions(options: string[]): string {
  return options
      .map(o => `${JSON.stringify(o)}`)
      .join('|');
}

export function generateTypes(code: Code.Builder, slices: Schema.Slice[], settings: Settings) {
  slices.forEach((slice) => {
    const ns = code.appendBlock(`export namespace ${slice.name} {`, '}');
    ns.append('export type Field = ')
        .appendLine(generateEnumOptions(Object.getOwnPropertyNames(slice.element)))
    defineRecordType(ns.appendBlock('export type Record = {', '}'), slice.element, settings.primitives)
    defineQueryBuilder(ns, "QueryBuilder", slice, settings);
  })
}

export function generateBuilderConstants(code: Code.Builder, namespace: string, collectionConst: string, slices: Schema.Slice[]) {
  slices.forEach((slice, index) => {
    code.append(`${slice.name}: new ${namespace}.${slice.name}.QueryBuilder({collection: ${collectionConst}, filters: [${JSON.stringify(slice.query)}]})`)
    code.appendLine(index < slices.length - 1 ? ',' : '')
  })
}