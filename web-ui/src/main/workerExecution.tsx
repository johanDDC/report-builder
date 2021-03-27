import React from 'react';
import {ExecutionWorker} from "./api";

function runCode(code: string): Promise<MessageEvent> {
    let worker = ExecutionWorker.getInstance();
    if (worker == null) {
        alert("Problem with worker initialization");
        return;
    }
    worker.postMessage(code);
    return new Promise(resolve => worker.onmessage = (response) => resolve(response));
}

export default function WorkerExecuter(props: { editor: { getValue: () => string } }) {
    return <>
        <button onClick={() => {
            runCode(props.editor.getValue())
        }}>
            Run in worker
        </button>
    </>
}