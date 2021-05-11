/**
 * Represents a single query request from report code
 */
import {getLocalScheme, SchemeCollection} from "./queryTypes";

export interface MongoQuery {
    /** MongoDB query as JSON */
    query: any;
    /** Additional server-specific info about what collection to run query against */
    context: any;
    projection: MongoProjection;
    limit: number;
    offset: number;
    sort: {};
}

export interface HttpQueryRequest {
    url: string;
    payload: any;
}

export interface MongoProjection {
    elemMatch: string;
    exclude: string[];
    excludeId: boolean;
    include: string[];
    slice: {
        fieldName: string,
        skip?: number,
        limit: number,
    };
}

export type QueryRequestBuilder = (query: MongoQuery) => HttpQueryRequest

export class ReportAPI {
    private headColumns: string[];
    private scheme: SchemeCollection;

    constructor(private readonly _requestBuilder: QueryRequestBuilder, scheme: SchemeCollection) {
        this.headColumns = [];
        this.scheme = scheme;
    }

    private editQuery(query: {}, localScheme: SchemeCollection) {
        for (let field of Object.keys(query)) {
            if (!localScheme.type[field]) {
                let subfields = field.split('.');
                let recordType = localScheme.type;
                for (let subfield of subfields) {
                    recordType = recordType[subfield].type;
                }
                query[field] = editField(field, query, recordType);
            }
            query[field] = editField(field, query, localScheme.type[field].type);
        }
        return query;

        function editField(field: string, query: {}, recordType: string | { [key: string]: SchemeCollection }) {
            if (typeof recordType != "string") {
                let newField = query;
                for (let subfield of Object.keys(query[field])) {
                    newField[field] = editField(subfield, query[field], recordType[subfield].type);
                }
                return newField;
            } else {
                let isOptionalObject = typeof query[field] == "object";
                if (localScheme.type[field].type == "Date" && !isOptionalObject) {
                    return {"$date": query[field].getTime()};
                } else if (localScheme.type[field].type == "objectId" && !isOptionalObject) {
                    return {"$oid": query[field]};
                } else if (localScheme.type[field].type == "Decimal" && !isOptionalObject) {
                    return {"$numberDecimal": query[field].asString()};
                } else {
                    return query[field];
                }
            }
        }
    }

    query(query: {}, context: any, projection?: MongoProjection, limit?: number, offset?: number, sort?: {}) {
        if (!(context["fixFields"] || context["fixFields"] == false)) {
            query = this.editQuery(query, getLocalScheme(this.scheme.type));
        }
        console.log(query);
        let queryRequest = this._requestBuilder({query, context, projection, limit, offset, sort});
        let request = new XMLHttpRequest();
        request.open("POST", queryRequest.url, false);
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify(queryRequest.payload));
        if (request.readyState == 4 && request.status == 200) {
            return JSON.parse(request.responseText);
        } else {
            return {};  // TODO errors
        }
    }

    table(data: Array<JSON>, headColumns?: string[]): void {
        this.configure(headColumns);
        // @ts-ignore
        postMessage({
            data: data,
            headColumns: headColumns,
        });
    }

    configure(headColumns?: string[]) {
        if (headColumns != undefined) {
            for (let column of headColumns) {
                this.headColumns.push(column);
            }
        }
    }
}