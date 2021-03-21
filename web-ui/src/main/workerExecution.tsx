import React from 'react';

function runCode(worker: Worker, code: string, context = {}): Promise<MessageEvent> {
    worker.postMessage([code, context]);
    return new Promise(resolve => worker.onmessage = (response) => resolve(response));
}

export default function WorkerExecuter(props: { editor: { getValue: () => string } }) {
    let worker;
    if (window.Worker) {
        worker = new Worker("js/worker.execution.js");
    } else {
        alert("Problem with worker initialization");
    }

    return <>
        <button onClick={() => {
            runCode(worker, props.editor.getValue())
        }}>
            Run in worker
        </button>
    </>
}