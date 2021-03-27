// @ts-ignore
import axios from "axios";

export interface State {
    message: string,
    time: Date
}

export function requestState(): Promise<State> {
    return axios.get('/rest/api/v1/helloWorld/')
        .then(response => {
            return {
                message: response.data.message,
                time: new Date(response.data.time),
            };
        });
}

export function shutdownServer() {
    return axios.post('/rest/api/v1/server/shutdown');
}

export function simpleQuery() {
    return axios.post('/rest/api/v1/db/testCollection/query', {
        query: {release_year: {$gt: 2020}}
    });
}

export class ReportAPI {
    constructor() {
    }

    query(query: {}): {} {
        console.log("api.query", query);
        return {};
    }

    table(data: Array<JSON>): void {
        console.log("api.table", data);
        // @ts-ignore
        postMessage(data);
    }
}