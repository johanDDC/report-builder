import React, {useState} from 'react';

/**
 * @param worker
 * @param code      The code which will be executed
 * @param context   The object key -> value, where key is the name
 *                  of the argument (will be used in Function construction), and
 *                  value is actual argument which will be passed in constructed
 *                  Function (in other words, value is a context, in what code
 *                  will be executed).
 */

function runCode(worker: Worker, code: string, context = {}): Promise<MessageEvent> {
    worker.postMessage([code, context]);
    return new Promise(resolve => worker.onmessage = (response) => resolve(response));
}

export default function WorkerExecuter(props: { editor: { getValue: () => string } }) {
    const [resulExecution, setResultExecution] = useState([]);
    let worker;
    if (window.Worker) {
        worker = new Worker("js/execution.worker.js");
    } else {
        alert("Problem with worker initialization");
    }

    return <>
        <button onClick={() => {
            runCode(worker, props.editor.getValue()).then(result => {
                if (result !== undefined) {
                    setResultExecution([...resulExecution, result]);
                }
            })
        }}>
            Run in worker
        </button>
        {resulExecution.map((val, key) => <div key={key}>{val}</div>)}
    </>
}