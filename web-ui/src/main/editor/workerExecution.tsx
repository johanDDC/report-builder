let worker;

export function getWorker() {
    if (!worker) {
        if (window.Worker) {
            worker = new Worker("js/worker.execution.js");
        } else {
            worker = null;
        }
    }
    return worker;
}

export default function runCode(code: string): Promise<MessageEvent> {
    let worker = getWorker();
    if (worker == null) {
        alert("Problem with worker initialization");
        return;
    }
    worker.postMessage(code);
    return new Promise(resolve => worker.onmessage = (response) => resolve(response));
}
