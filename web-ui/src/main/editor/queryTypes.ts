// declare type Columns = "show_id" | "country" | "cast" | "director" | "release_date" | "duration" | "description";
//
// type MongoTypes = {
//     object: "object",
//     string: "string",
//     double: "number",
//     bool: "boolean",
//     int: "number",
//     long: "number",
// }
//
// declare type MongoQueryOperator<T> =
//     { "$eq": T } | { "$ne": T } |
//     { "$in": T[] } | { "$nin": T[] } |
//     { "$gt": T } | { "$gte": T } | { "$lt": T } | { "$lte": T };
//
// declare type MongoQueryRule;
//
// declare type MongoProjection = {
//     elemMatch: string;
//     exclude: Columns[];
//     excludeId: boolean;
//     include: Columns[];
//     slice: {
//         fieldName: Columns,
//         skip?: number,
//         limit: number,
//     };
// };
//
// declare type MongoSortRules = {};
//
// declare namespace api {
//     function query(query: MongoQueryRule, context: any,
//                    projection?: MongoProjection, limit?: number,
//                    offset?: number, sort?: MongoSortRules): any[];
//
//     function table(data: any[], headColumns?: Columns[]);
// }

// type anyField<T extends string> = Partial<{ [f in T]: MongoQueryOperator<string | number> }>
// type anyQ<T extends string> = anyField<T> | { and: anyQ<T>[] }
//
//

// type QPrimitiveField<T> = {'$eq': T} | {'$gt': T}
// type Q1 = {f1: QPrimitiveField<string>}
// // type Q2 = {f2: QPrimitiveField<number>}
// type Q2 = {f2: {'$eq': number}}
// type Qfield = Q1 | Q2;
// type genQall<T> = {and: genQall<T>[]} | T
// type Qall = genQall<Qfield>
//
// const q1: Qall = {f1: {$eq: '11'}, f2: {$gt: 33}}
// const q2: Qall = {and: [{f1: {$eq: '11'}}, {f2: {$gt: 33}}]}
// type anyField<T extends string> = Partial<{ [f in T]: MongoQueryOperator<string | number> }>
// type anyQ<T extends string> = anyField<T> | { and: anyQ<T>[] }
//
// const qq: anyField<'_id' | 'a'> = {}


// type Qobjid<T> = { "$eq": T } | T;
// type QPrimitiveField<T> = Qobjid<T> | { '$gt': T };
// type Q_id = { "_id": Qobjid<string> }
// type Qs = { s: QPrimitiveField<string> };
// type Qn = { n: QPrimitiveField<number> };
// type Qfield = Q_id | Qs | Qn;
// type genQall<T> = { and: genQall<T>[] } | T
// type Qall = genQall<Qfield>

// const query: Qall = {_id: {$eq: "1111"}, and: [{n: {$gt: 18}}, {s: "loh"}]}
declare type SchemeCollection = { arr?: boolean, optional?: boolean, type: string | { [key: string]: SchemeCollection } }
// @ts-ignore
function typesGenerator(scheme: SchemeCollection) {
    let d_ts = "type Qobjid<T> = { \"$eq\": T } | T;\n" +
        "type QPrimitiveField<T> = Qobjid<T> | { \"$ne\": T } |\n" +
        "    { \"$in\": T[] } | { \"$nin\": T[] } |\n" +
        "    { \"$gt\": T } | { \"$gte\": T } | { \"$lt\": T } | { \"$lte\": T };\n" +
        "type Q_id = { \"_id\": Qobjid<string> };\n";
    let fields = Object.keys(scheme.type);
    for (let field of fields) {
        let currentType: SchemeCollection = scheme.type[field];
        d_ts += `type Q_${field} = ${constuctType(currentType.type, currentType.arr, field, currentType.optional)};\n`;
    }
    return d_ts;
}

export function constuctType(typeDescription: string | { [key: string]: SchemeCollection }, arr?: boolean, fieldName?: string, optional?: boolean) {
    if (typeof typeDescription != "string") {
        let globalType: string = "";
        for (let key of Object.keys(typeDescription)) {
            if (globalType.length > 0) {
                globalType += "|";
            }
            let description = typeDescription[key];
            let typed: string = constuctType(description.type, description.arr, key);
            globalType += `{${key}${description.optional ? "?" : ""} : ${typed}}`;
        }
        return `{${fieldName}${optional ? "?" : ""} : ${globalType}${arr ? "[]" : ""}}`;
    }
    let primitive: string = "";
    if (typeDescription == "string"){
        primitive = `QPrimitiveField<string${arr ? "[]" : ""}>`;
    } else if(typeDescription == "int" || typeDescription == "long" || typeDescription == "double"){
        primitive = `QPrimitiveField<number${arr ? "[]" : ""}>`;
    } else if (typeDescription == "bool"){
        primitive = `QPrimitiveField<boolean${arr ? "[]" : ""}>`;
    }
    return primitive;
}
// @ts-ignore
const Scheme1: SchemeCollection = {
    arr: false,
    type: {
        "_id": {arr: false, type: "objectId"},
        "show_id": {arr: false, type: "string"},
        "director": {arr: false, type: "string"},
        "cast": {arr: true, type: "string"},
        "release_year": {arr: false, type: {"date": {arr: false, type: "date"}}},
        "description": {arr: false, type: "string"}
    }
};
// @ts-ignore
const Scheme2: SchemeCollection = {
    arr: false,
    type: {
        duration: {type: {mins: {optional: true, type: "int"}, seasons: {optional: true, type: "int"}}},
        info: {type: {ses: {arr: true, type: "string"}, dur: {arr: true, type: "int"}}},
        a: {arr: true, type: {b: {type: "int"}}},
    }
}