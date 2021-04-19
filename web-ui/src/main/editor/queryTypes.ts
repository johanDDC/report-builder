declare type Columns = "show_id" | "country" | "cast" | "director" | "release_date" | "duration" | "description";

type MongoTypes = {
    object: "object",
    string: "string",
    double: "number",
    bool: "boolean",
    int: "number",
    long: "number",
}

declare type SchemeCollection = { arr?: boolean, type: MongoTypes | { [key: string]: SchemeCollection } }

declare const Scheme: SchemeCollection;

declare type MongoQueryOperator<T> =
    { "$eq": T } | { "$ne": T } |
    { "$in": T[] } | { "$nin": T[] } |
    { "$gt": T } | { "$gte": T } | { "$lt": T } | { "$lte": T } |
    { "$and": MongoQueryRule[] };

declare type MongoQueryRule = { [field in Columns]: MongoQueryOperator<???> };

declare type MongoProjection = {
    elemMatch: string;
    exclude: Columns[];
    excludeId: boolean;
    include: Columns[];
    slice: {
        fieldName: Columns,
        skip?: number,
        limit: number,
    };
};

declare type MongoSortRules = {};

declare namespace api {
    function query(query: MongoQueryRule, context: any,
                   projection?: MongoProjection, limit?: number,
                   offset?: number, sort?: MongoSortRules): any[];

    function table(data: any[], headColumns?: Columns[]);
}