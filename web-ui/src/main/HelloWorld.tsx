import React from "react";

import {withLoadedPromiseAndParams} from "./utils";
import * as API from "./api";
import {Messages} from "./messagesApi/messages";

import RunButton from "./customComponents/RunButton";

function codeExecuter(code: string) {
    return new Function('messages', code);
}

function LoadedHelloWorld(props: { data: API.State }) {
    Messages.bindBlock("root");
    let executeFunc = codeExecuter("messages.add('Hello'); messages.add('World!');");

    return <div>
        <h1>Message: {props.data.message}</h1>
        <h1>Time: {props.data.time.toString()}</h1>
        <RunButton codeExecuter={executeFunc} context={Messages}/>
    </div>
}

const HelloWorld = withLoadedPromiseAndParams(API.requestState, LoadedHelloWorld, {});

export default HelloWorld;
