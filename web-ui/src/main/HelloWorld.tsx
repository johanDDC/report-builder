import React from "react";
// @ts-ignore
import axios from "axios"
import {withLoadedPromiseAndParams} from "./utils";

interface State {
    message: string,
    time: Date
}

function requestState(): Promise<State> {
    return axios.get('/rest/api/v1/helloWorld/')
        .then(response => {
            return {
                message: response.data.message,
                time: new Date(response.data.time),
            };
        });
}

function LoadedHelloWorld(props: { data: State }) {
    return <div>
            <h1>Message: {props.data.message}</h1>
            <h1>Time: {props.data.time.toString()}</h1>
        </div>
}

const HelloWorld = withLoadedPromiseAndParams(requestState, LoadedHelloWorld, {});

export default HelloWorld;
