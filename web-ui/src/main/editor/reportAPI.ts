/**
 * Represents a single query request from report code
 */
export interface MongoQuery {
    /** MongoDB query as JSON */
    query: any;
    /** Additional server-specific info about what collection to run query against */
    context: any;
}

export interface HttpQueryRequest {
    url: string;
    payload: any;
}

export type QueryRequestBuilder = (query: MongoQuery) => HttpQueryRequest

export class ReportAPI {
    private headColumns: string[];

    constructor(private readonly _reuestBuilder: QueryRequestBuilder) {
    }

    query(query: {}, context: any) {
        let queryRequest = this._reuestBuilder({query, context});
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