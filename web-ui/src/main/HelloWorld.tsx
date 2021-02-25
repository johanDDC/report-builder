import React from "react";

import {withLoadedPromiseAndParams} from "./utils";
import * as API from "./api";

function LoadedHelloWorld(props: { data: API.State }) {
    return <div>
            <h1>Message: {props.data.message}</h1>
            <h1>Time: {props.data.time.toString()}</h1>
        </div>
}

const HelloWorld = withLoadedPromiseAndParams(API.requestState, LoadedHelloWorld, {});

export default HelloWorld;
