/**
 * Represents a single query request from report code
 */
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

/** Declares messages from a report worker to the main (UI) thread */
export namespace Messages {
    /** Messages about execution state change: start/finish */
    export const TYPE_STATE = 'state'
    /** Messages about report is ready */
    export const TYPE_REPORT = 'report'

    /** Base interface for all message types */
    export interface Base {
        /** Type of the message */
        readonly type: string
    }

    /** State-change message */
    export interface State extends Base {
        readonly running: boolean
        readonly error: string | null
    }

    /**
     * @param error cause of termination. If set, the execution has finished with this error
     * @param running true if the report execution is in progress
     * @return state-change message
     */
    export function state(error: string, running?: boolean): State {
        if (error) return {type: TYPE_STATE, running: false, error}
        if (running === undefined) console.error("Missing running state")
        return {type: TYPE_STATE, running: !!running, error: null}
    }

    export interface Report extends Base {
        readonly data: any[]
        readonly columns?: string[]
    }
}

export class ReportAPI {
    private headColumns: string[];

    constructor(private readonly _requestBuilder: QueryRequestBuilder) {
        this.headColumns = [];
    }

    query(query: {}, context: any, projection?: MongoProjection, limit?: number, offset?: number, sort?: {}) {
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
            type: Messages.TYPE_REPORT,
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