import * as React from "react";

import {withLoadedPromiseAndParams} from "../editor/utils";
import * as API from "../editor/api";

function LoadedHelloWorld(props: { data: API.State }) {
    return <div>
            <h1>Message: {props.data.message}</h1>
            <h1>Time: {props.data.time.toString()}</h1>
        </div>
}

const HelloWorld = withLoadedPromiseAndParams(API.requestState, LoadedHelloWorld, {});

export default HelloWorld;
