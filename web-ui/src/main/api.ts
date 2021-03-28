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

let worker;

export function getWorker() {
    if (!worker) {
        if (window.Worker) {
            worker = new Worker("js/worker.execution.js");
        } else {
            worker = null;
        }
    }
    return worker;
}