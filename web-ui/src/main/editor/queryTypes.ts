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
        let types: string[] = [];
        let currentSortRules = [];
        inorderWalk(currentType.type, field, currentType.arr, types);
        constructSortRules(currentType.type, field, currentSortRules);
        d_ts += `type Q_${field} = ${types.map(val => `{${val}}`).join("|")};\n`;
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
    let primitive: string = `QPrimitiveField<${mapMongoTypes(typeDescription)}${arr ? "[]" : ""}>`;
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
    if (mongoType == "int32" || mongoType == "int64" || mongoType == "double") {
        return "number";
    }
    if (mongoType == "string") {
        return "string";
    }
    if (mongoType == "bool") {
        return "boolean";
    }
    if (mongoType == "datetime") {
        return "Date";
    }
    if (mongoType == "objectId") {
        return "string";
    }
    if (mongoType == "bin") {
        return "string";
    }
    if (mongoType == "decimal128") {
        return "Decimal";
    }
}

export function parseType(obj: object) {
    if (obj["$date"]) {
        return new Date(obj["$date"]);
    }
    if (obj["$numberDecimal"]) {
        return new Decimal(obj["$numberDecimal"]);
    }
    if (obj["$oid"]) {
        return obj["$oid"];
    }
    return obj;
}

export function queryBuildersGenerator(scheme: SchemeCollection, collectionName: string) {
    let builderTypes =
        "type builderOptions<T> = {\n" +
        "    greater?: T,\n" +
        "    less?: T,\n" +
        "};\n" +
        "declare function isBuilderOptions(obj: object);\n" +
        `declare class ${collectionName} {
        constructor();\n`;
    let builderExtension =
        "function isBuilderOptions(obj) {\n" +
        "    if (obj[\"greater\"] || obj[\"less\"]) {\n" +
        "        return true;\n" +
        "    }\n" +
        "    return false;\n" +
        "}\n" +
        "function mapToMongo(obj, type) {\n" +
        "    type = type.substring(type.indexOf('<') + 1, type.indexOf('>'));\n" +
        "    if (type == \"_id\") {\n" +
        "        return {\"$oid\": obj};\n" +
        "    } else if (type == \"Decimal\") {\n" +
        "        return {\"$numberDecimal\": obj.asString()};\n" +
        "    } else if (type == \"Date\") {\n" +
        "        return {\"$date\": obj.getTime()};\n" +
        "    } else {\n" +
        "        return obj;\n" +
        "    }\n" +
        "}\n\n" +
        `class ${collectionName} {\n` +
        "\n" +
        "constructor(queryObj) {\n" +
        "        this.queryObj = queryObj;\n" +
        "}\n";
    for (let field of Object.keys(scheme.type)) {
        let methods = [];
        let signatures = [];
        myInorderWalk(scheme.type[field].type, field, scheme.type[field].arr, methods, signatures);
        builderExtension += methods.join("\n");
        builderTypes += signatures.join("\n");
    }
    builderExtension +=
        `query() {
            api.table(api.query(this.queryObj, {fixFields: false}));
        }\n}`;
    builderTypes +=
        `query();\n}`;
    console.log(builderTypes);
    return [builderExtension, builderTypes];

    function myInorderWalk(typeDescription: string | { [key: string]: SchemeCollection }, field: string, arr: boolean, methods = [], signatures = []) {
        let types = [];
        inorderWalk(typeDescription, field, arr, types);
        for (let typestring of types) {
            let typeQuery = typestring.substring(0, typestring.indexOf(':')).replace(/"/g, "");
            let typeField = typeQuery.replace('.', '_');
            let typeType = typestring.substring(typestring.indexOf(': ') + 2);
            signatures.push(`${typeField}(...options: Partial<${typeType}>[] | builderOptions<Partial<${typeType}>>[]) : ${collectionName};\n`);
            signatures.push(`static ${typeField}(...options: Partial<${typeType}>[] | builderOptions<Partial<${typeType}>>[]) : ${collectionName};\n`);
            if (typeField == "_id"){
                typeType = "<_id>";
            }
            methods.push(`${typeField}(...options){
    if (isBuilderOptions(options[0])) {
        let query = {};
        if (options[0].greater) {
            query["$gt"] = mapToMongo(options[0].greater, "${typeType}");
        }
        if (options[0].less) {
            query["$lt"] = mapToMongo(options[0].less, "${typeType}");
        }
        return new ${collectionName}({...this.queryObj, \"${typeQuery}\": query});
    } else if (options.length > 1) {
        return new ${collectionName}({...this.queryObj, \"${typeQuery}\": {"$in": options.map(e => mapToMongo(e, \"${typeType}\"))}});
    } else {
        return new ${collectionName}({...this.queryObj, \"${typeQuery}\": mapToMongo(options[0], \"${typeType}\")});
    }
}\n`);
            methods.push(`static ${typeField}(...options){
    if (isBuilderOptions(options[0])) {
        let query = {};
        if (options[0].greater) {
            query["$gt"] = mapToMongo(options[0].greater, "${typeType}");
        }
        if (options[0].less) {
            query["$lt"] = mapToMongo(options[0].less, "${typeType}");
        }
        return new ${collectionName}({\"${typeQuery}\": query});
    } else if (options.length > 1) {
        return new ${collectionName}({\"${typeQuery}\": {"$in": options.map(e => mapToMongo(e, \"${typeType}\"))}});
    } else {
        return new ${collectionName}({\"${typeQuery}\": mapToMongo(options[0], \"${typeType}\")});
    }
}\n`);
        }
    }
}

export class Decimal {
    private data: number;

    constructor(decimal: number | string) {
        if (typeof decimal == "number") {
            this.data = decimal;
        } else {
            this.data = Number(decimal);
        }
    }

    asString() {
        return this.data.toString();
    }

    asNumber() {
        return this.data;
    }
}

export const DecimalDeclaration = "class Decimal {\n" +
    "    private data: number;\n" +
    "\n" +
    "    constructor(decimal: number | string) {\n" +
    "        if (typeof decimal == \"number\") {\n" +
    "            this.data = decimal;\n" +
    "        } else {\n" +
    "            this.data = Number(decimal);\n" +
    "        }\n" +
    "    }\n" +
    "\n" +
    "    asString() {\n" +
    "        return this.data.toString();\n" +
    "    }\n" +
    "\n" +
    "    asNumber() {\n" +
    "        return this.data;\n" +
    "    }\n" +
    "}";

export const DecimalImplementation = "class Decimal {\n" +
    "    constructor(decimal) {\n" +
    "        if (typeof decimal == \"number\") {\n" +
    "            this.data = decimal;\n" +
    "        } else {\n" +
    "            this.data = Number(decimal);\n" +
    "        }\n" +
    "    }\n" +
    "\n" +
    "    asString() {\n" +
    "        return this.data.toString();\n" +
    "    }\n" +
    "\n" +
    "    asNumber() {\n" +
    "        return this.data;\n" +
    "    }\n" +
    "}"

export function getLocalScheme(scheme: string | { [key: string]: SchemeCollection }): SchemeCollection {
    let localScheme: { [k: string]: any } = {};
    for (let field of Object.keys(scheme)) {
        Object.defineProperty(localScheme, field, {value: {}});
        if (scheme[field].arr) {
            localScheme[field].arr = true;
        }
        if (typeof scheme[field].type == "string") {
            localScheme[field].type = mapMongoTypes(scheme[field].type);
        } else {
            localScheme[field].type = getLocalScheme(scheme[field].type);
        }
    }
    return {type: localScheme};
}