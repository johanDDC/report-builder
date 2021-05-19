import axios from "axios";

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
    /** Debug message from the script */
    export const TYPE_DEBUG = 'debug'
    /** The message contains serialized exception */
    export const TYPE_EXCEPTION = 'exception'

    /** Base interface for all message types */
    export interface Base {
        /** Type of the message */
        readonly type: string
    }

    export function sendMessage(message: Base) {
        // @ts-ignore
        postMessage(message)
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
        /** Report ID. The ID is unique among reports from the same script run */
        readonly id: number
        readonly data: any[]
        readonly columns?: string[]
        /** Displayable name of the report */
        readonly name: string
    }

    export interface Debug extends Base {
        readonly problem: boolean
        readonly text: string
    }

    export interface Exception extends Base {
        readonly name?: string
        readonly message: string
        readonly stack?: string
    }

    export function exception(e: any): Exception {
        const name = e.name;
        const message = e.message;
        const stack = e.stack;
        return {
            type: TYPE_EXCEPTION,
            name: typeof name === 'string' ? name : undefined,
            message: message ? '' + message : e.toString(),
            stack: typeof stack === 'string' ? stack : undefined
        }
    }
}

export class ReportAPI {
    private headColumns: string[];
    private reportId: number = 1

    constructor(private readonly _requestBuilder: QueryRequestBuilder) {
        this.headColumns = [];
    }

    query(query: {}, context: any, projection?: MongoProjection, limit?: number, offset?: number, sort?: {}) {
        const startTime = new Date().getTime()
        console.log(query);
        let queryRequest = this._requestBuilder({query, context, projection, limit, offset, sort});
        axios.post(queryRequest.url, queryRequest.payload).then(resp => {
            const elasped = new Date().getTime() - startTime
            if (resp.status == 200) {
                ReportAPI.sendDebugMessage(`Query succeeded in ${elasped}ms`, false)
                return resp.data;
            } else {
                ReportAPI.sendDebugMessage(`Query failed in ${elasped}ms with status code ${resp.status}`, true)
                throw Error(`Server responded with status code ${resp.status}`)
            }
        });
    }

    logInfo(text: string) {
        ReportAPI.sendDebugMessage(text, false)
    }

    logError(text: string) {
        ReportAPI.sendDebugMessage(text, true)
    }

    logException(exception: any) {
        Messages.sendMessage(Messages.exception(exception))
    }

    breakpoint() {
        // Enables search for this string '@breakpoint'
        console.log('@breakpoint')
    }

    private static sendDebugMessage(text: string, problem: boolean) {
        Messages.sendMessage({
            type: Messages.TYPE_DEBUG,
            problem,
            text
        } as Messages.Debug)
    }

    table(data: Array<JSON>, name?: string, headColumns?: string[]): void {
        this.configure(headColumns);
        const id = this.reportId++
        if (!name) name = 'Report #' + id
        Messages.sendMessage({
            type: Messages.TYPE_REPORT,
            name: name,
            id: id,
            data: data,
            headColumns: headColumns,
        } as Messages.Report);
    }

    configure(headColumns?: string[]) {
        if (headColumns != undefined) {
            for (let column of headColumns) {
                this.headColumns.push(column);
            }
        }
    }
}

export function constructEnv(url : string){
    function buildRequest(query: MongoQuery): HttpQueryRequest {
        let payload = {
            query: query.query,
            projection: query.projection,
            limit: query.limit,
            offset: query.offset,
            sort: query.sort,
        };
        return {
            url: url,
            payload: payload,
        }
    }
    return new ReportAPI(buildRequest);
}
// axios.post("http://localhost:8080/rest/api/v1/db/testCollection/query/", {query:{"$and": [{"_id": {"$eq": "604fb73b49350172e8292780"}}]}})