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

export class ExecutionWorker {
    private static worker;

    public static getInstance() {
        if (!ExecutionWorker.worker) {
            if (window.Worker) {
                ExecutionWorker.worker = new Worker("js/worker.execution.js");
            } else {
                ExecutionWorker.worker = null;
            }
        }
        return ExecutionWorker.worker;
    }
}