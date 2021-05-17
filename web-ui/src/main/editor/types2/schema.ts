export type ObjectType = { [field: string]: Type }

export type Type = string // Primitive
    | { array: true, element: Type} // Array of 'element'
    | ObjectType
    | string[]; // Enum of enumerated options

export type Slice = { query: any, name: string, element: ObjectType }

export type CollectionSchema = {
  collection: string
  slices?: Slice[]
  schema?: Type
}

export interface Visitor<T> {
  primitive?(field: T, type: string)
  array?(field: T, type: Type)
  enum?(field: T, options: string[])
  object?(field: T, type: ObjectType)
}

export function accept(objectType: ObjectType, visitor: Visitor<string>) {
  if (typeof objectType !== 'object' || Array.isArray(objectType)) return
  Object.getOwnPropertyNames(objectType).forEach(field => {
    const type = objectType[field];
    if (typeof type === 'string') {
      if (visitor.primitive) visitor.primitive(field, type)
    } else if (Array.isArray(type)) {
      if (visitor.enum) visitor.enum(field, type)
    } else if (typeof type === 'object') {
      if (type.array === true) {
        if (!type.element) throw Error(`Illegal type of '${field}': '${type}'`)
        if (visitor.array) visitor.array(field, type.element)
      } else {
        if (visitor.object) visitor.object(field, type as ObjectType)
      }
    }
  })
}

export function acceptFieldPaths(objectType: ObjectType, visior: Visitor<string[]>) {
  const path: string[] = []
  const wrapper: Visitor<string> = {
    array(field: string, type: Type) {
      if (visior.array)
        visior.array([...path, field], type)
    },
    primitive(field: string, type: string) {
      if (visior.primitive)
        visior.primitive([...path, field], type)
    },
    enum(field: string, options: string[]) {
      if (visior.enum)
        visior.enum([...path, field], options)
    },
    object(field: string, type: ObjectType) {
      if (visior.object)
        visior.object([...path, field], type)
      path.push(field)
      accept(type, wrapper)
      path.splice(-1, 1)
    }
  }
  accept(objectType, wrapper)
}
