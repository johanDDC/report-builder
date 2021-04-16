export class WorkerManager {
    private _worker: Worker;

    constructor(private readonly _workerUrl: string) {}

    getWorker(): Worker {
        if (!this._worker) {
            if (!window.Worker) throw Error("Workers are not supported");
            this._worker = new Worker(this._workerUrl);
        }
        return this._worker;
    }

    runCode(code: string): Promise<MessageEvent> {
        let worker = this.getWorker();
        if (worker == null) {
            alert("Problem with worker initialization");
            return;
        }
        worker.postMessage(code);
        return new Promise(resolve => worker.onmessage = (response) => resolve(response));
    }
}
