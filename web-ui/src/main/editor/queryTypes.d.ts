declare type Columns = "show_id" | "country" | "cast" | "director" | "release_date" | "duration" | "description";

declare type Scheme = {}

declare type MongoQueryOperator<T> =
    { "$eq": T } | { "$ne": T } |
    { "$in": T[] } | { "$nin": T[] } |
    { "$gt": T } | { "$gte": T } | { "$lt": T } | { "$lte": T } |
    { "$and": MongoQueryRule[]};

declare type MongoQueryRule = {[field : Columns]: MongoQueryOperator<any>};

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