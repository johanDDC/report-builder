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
export type SchemeCollection = { arr?: boolean, type: string | { [key: string]: SchemeCollection } }

// @ts-ignore
export function typesGenerator(scheme: SchemeCollection) {
    let d_ts = "type Qobjid<T> = { \"$eq\": T } | T;\n" +
        "type QPrimitiveField<T> = Qobjid<T> | { \"$ne\": T } |\n" +
        "    { \"$in\": T[] } | { \"$nin\": T[] } |\n" +
        "    { \"$gt\": T } | { \"$gte\": T } | { \"$lt\": T } | { \"$lte\": T };\n" +
        "type Q_id = { \"_id\": Qobjid<string> };\n";
    let fields = Object.keys(scheme.type);
    for (let field of fields) {
        let currentType: SchemeCollection = scheme.type[field];
        // let constructedType = constuctType(currentType.type, currentType.arr, field).map(val => {
        //     val = "\"" + val;
        //     return `{${val}}`;
        // }).join("|");
        let types :string[] = [];
        inorderWalk(currentType.type, field, currentType.arr, types)
        d_ts += `type Q_${field} = ${types.map(val => `{${val}}`).join("|")};\n`;
    }
    return d_ts;
}

export function inorderWalk(typeDescription: string | { [key: string]: SchemeCollection }, fieldName: string, arr?: boolean, types: string[] = [], typeString = ""): string {
    if (typeString.length == 0) {
        typeString = fieldName;
    }
    if (typeof typeDescription != "string") {
        let nestedTypes: string[] = [];
        for (let field of Object.keys(typeDescription)) {
            nestedTypes.push(inorderWalk(typeDescription[field].type, field, typeDescription[field].arr,
                types, `${typeString}.${field}`));
        }
        types.push(`\"${typeString}\": {${nestedTypes.join(",")}}${arr ? "[]" : ""}`);
        return `${fieldName}: {${nestedTypes.join(",")}}${arr ? "[]" : ""}`;
    }
    let primitive: string = "";
    if (typeDescription == "string") {
        primitive = `QPrimitiveField<string${arr ? "[]" : ""}>`;
    } else if (typeDescription == "int" || typeDescription == "long" || typeDescription == "double") {
        primitive = `QPrimitiveField<number${arr ? "[]" : ""}>`;
    } else if (typeDescription == "bool") {
        primitive = `QPrimitiveField<boolean${arr ? "[]" : ""}>`;
    }
    types.push(`\"${typeString}\": ${primitive}`);
    return `${fieldName}: ${primitive}`;
}