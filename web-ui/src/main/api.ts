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