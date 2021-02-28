import React, {useRef} from "react";

import {withLoadedPromiseAndParams} from "./utils";
import * as API from "./api";
import {Messages} from "./messagesApi/messages";

import RunButton from "./customComponents/RunButton";

function codeExecuter(code: string) {
    return new Function('messages', code);
}

function LoadedHelloWorld(props: { data: API.State }) {
    const mainBlock = useRef(null);
    Messages.bindBlock(mainBlock);
    let executeFunc = codeExecuter("messages.add('Hello'); messages.add('World!');");

    return <div ref={mainBlock}>
        <h1>Message: {props.data.message}</h1>
        <h1>Time: {props.data.time.toString()}</h1>
        <RunButton codeExecuter={executeFunc} context={Messages}/>
    </div>
}

const HelloWorld = withLoadedPromiseAndParams(API.requestState, LoadedHelloWorld, {});

export default HelloWorld;
