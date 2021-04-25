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
    let typesNames = [];
    let sortRules = [];
    for (let field of fields) {
        let currentType: SchemeCollection = scheme.type[field];
        // let constructedType = constuctType(currentType.type, currentType.arr, field).map(val => {
        //     val = "\"" + val;
        //     return `{${val}}`;
        // }).join("|");
        let types: string[] = [];
        let currentSortRules = [];
        inorderWalk(currentType.type, field, currentType.arr, types);
        constructSortRules(currentType.type, field, currentSortRules);
        d_ts += `type Q_${field} = ${types.map(val => `{${val}}`).join("|")};\n`;
        console.log(currentSortRules);
        sortRules = sortRules.concat(currentSortRules);
        typesNames.push(`Q_${field}`);
    }
    d_ts += `type MongoQueryRules = Partial<${typesNames.join("|")}>;\n`;
    d_ts += `type MongoSortRules = Partial<${sortRules.join("|")}>;\n`
    d_ts += "declare namespace api {\n" +
        "     function query(query: MongoQueryRules, context: any,\n" +
        "                    projection?: object, limit?: number,\n" +
        "                    offset?: number, sort?: MongoSortRules): any[];\n" +
        "\n" +
        "    function table(data: any[], headColumns?: Columns[]);\n" +
        "}";
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

export function constructSortRules(typeDescription: string | { [key: string]: SchemeCollection }, fieldName: string, types: string[] = []): void {
    types.push(`{\"${fieldName}\": 1 | -1}`);
    if (typeof typeDescription != "string") {
        for (let field of Object.keys(typeDescription)) {
            constructSortRules(typeDescription[field].type, `${fieldName}.${field}`, types);
        }
    }
}

function mapMongoTypes(mongoType: string) {
    if (mongoType == "int" || mongoType == "long" || mongoType == "double" || mongoType == "float") {
        return "number";
    }
    if (mongoType == "string") {
        return "string";
    }
    if (mongoType == "bool") {
        return "boolean";
    }
}

declare type MongoQueryRules = object;


// type builderOptions = {
//     greater: any,
//     less: any,
// };

// class Collection {
//     private static scheme: SchemeCollection = {
//         type: {a: {type: "string"}, b: {type: "int"}, c: {type: "date"}}
//     };
//
//     private static query: MongoQueryRules = {};
//
//     static a(...options: string[] | builderOptions[]) {
//         if (typeof options[0] != "string") {
//             this.query["a"] = {"$gt": options[0].greater, "$lt": options[0].less};
//         } else if (options.length > 1) {
//             this.query["a"] = {"$in": options};
//         } else {
//             this.query["a"] = {"a": options[0]};
//         }
//         return this;
//     }
//
//     static b(...options: number[] | builderOptions[]) {
//         if (typeof options[0] != "number") {
//             this.query["a"] = {"$gt": options[0].greater, "$lt": options[0].less};
//         } else if (options.length > 1) {
//             this.query["a"] = {"$in": options};
//         } else {
//             this.query["a"] = {"a": options[0]};
//         }
//         return this;
//     }
//
//     static query() {
//         // api.query(this.query);
//         this.query = {};
//     }
// }
//
// Collection.a('abc');
// Collection.a('A', 'B');
// Collection.a({greater: 10, less: 100})

export function queryBuildersGenerator(scheme: SchemeCollection) {
    let builderExtension = "" +
        "type builderOptions = {\n" +
        "    greater: any,\n" +
        "    less: any,\n" +
        "};\n" +
        "class Collection {\n" +
        "\n" +
        "    private static queryObj: MongoQueryRules = {};\n";
    for (let field of Object.keys(scheme.type)) {
        let fieldType = mapMongoTypes(scheme.type[field].type);
        let method =
            `static ${field}(...options: ${fieldType}[] | builderOptions[]) {
                if (typeof options[0] != "${fieldType}") {
                    this.queryObj["${field}"] = {"$gt": options[0].greater, "$lt": options[0].less};
                } else if (options.length > 1) {
                    this.queryObj["${field}"] = {"$in": options};
                } else {
                    this.queryObj["${field}"] = {"${field}": options[0]};
                }
                return this;
            }`;

        builderExtension += method;
    }
    builderExtension +=
        `static query() {
            api.query(this.queryObj);
            this.queryObj = {};
        }`;
    builderExtension += "}";
    console.log(builderExtension);
    return builderExtension;
}