import React from 'react';

let worker;

function runCode(code: string): Promise<MessageEvent> {
    worker.postMessage(code);
    return new Promise(resolve => worker.onmessage = (response) => resolve(response));
}

export default function WorkerExecuter(props: { editor: { getValue: () => string } }) {
    if (!worker) {
        console.log("gere");
        if (window.Worker) {
            worker = new Worker("js/worker.execution.js");
        } else {
            alert("Problem with worker initialization");
        }
    }

    return <>
        <button onClick={() => {
            runCode(props.editor.getValue())
        }}>
            Run in worker
        </button>
    </>
}