import {Listeners} from "./simpleUtils";
import {Messages} from "./reportAPI";

import {SchemeCollection} from "./queryTypes";

export class WorkerManager {
    private _currentExecution: ExecutionImpl
    private _disposed = false

    // runCode(code: string, scheme: SchemeCollection): Promise<MessageEvent> {
    //     let worker = this.getWorker();
    //     if (worker == null) {
    //         alert("Problem with worker initialization");
    //         return;
    //     }
    //     worker.postMessage({code: code, scheme: scheme});
    //     return new Promise(resolve => worker.onmessage = (response) => resolve(response));
    // }

    constructor(private readonly _workerUrl: string) {}

    /**
     * Creates a new report execution.
     * The caller must {@link Execution#start()} after subscribing its listeners
     */
    newExecution(): Execution {
        let worker = this.prepareWorker();
        if (worker == null)
            return new ExecutionImpl(Messages.state("Workers are not supported"), null)
        let execution = new ExecutionImpl(Messages.state(null, true), worker);
        this._currentExecution = execution;
        return execution;
    }

    /** Terminates any started worker and stops starting new workers */
    dispose() {
        if (this._disposed) return
        if (this._currentExecution) this._currentExecution.terminate('Terminated: The execution environment has been disposed')
        this._currentExecution = null
        this._disposed = true
    }

    private prepareWorker(): Worker {
        if (this._disposed) throw Error('Disposed')
        let worker: Worker;
        if (this._currentExecution) {
            if (!this._currentExecution.state.running)
                worker = this._currentExecution.detachWorker()
            this._currentExecution.terminate("Terminated: For the next execution")
            this._currentExecution = null
        }
        if (!worker) {
            if (!window.Worker) return null
            worker = new Worker(this._workerUrl);
        }
        return worker;
    }
}

export type MessageListener = (m: Messages.Base) => void

export interface Execution {
    /**
     * Adds a listener which will receive messages from the worker within this execution
     * @param listener
     * @param types send messages of the given types only
     */
    listenMessages(listener: MessageListener, types?: string[] | string): () => void

    /** Current state of the execution */
    readonly state: Messages.State

    /** When the execution has been started (created) */
    readonly startedOn: Date

    /** Starts execution of the report */
    start(code: string, scheme: SchemeCollection)

    /** Terminates this execution */
    terminate(reason: string)
}

class ExecutionImpl implements Execution {
    readonly startedOn = new Date()
    private _listeners = new Listeners<MessageListener>()

    constructor(private _state: Messages.State, private _worker: Worker) {
        if (this._worker) this._worker.onmessage = msg => {
            if (this._worker) this.onMessage(msg) // Do not send messages after detaching the worker
        }
    }

    listenMessages(listener: (m: Messages.Base) => void, types?: string[] | string): () => void {
        return this._listeners.addListener((msg) => {
            if (types && types !== msg.type
                && ((typeof (types as any).find !== 'function') || !(types as string[]).find(t => t === msg.type)))
                return
            listener(msg)
        })
    }

    get state() { return this._state }

    start(code: string, scheme: SchemeCollection) {
        if (!this._worker) throw Error('Cannot start: has no worker')
        if (!this._state.running) throw Error('Cannot start: already done')
        this._worker.postMessage({code: code, scheme: scheme});
    }

    terminate(reason: string) {
        if (!this._state.running) return
        if (!reason) {
            console.error("Missing termination reason")
            reason = 'Terminated'
        }
        if (this._worker) this._worker.terminate()
        this._worker = null
        this.onMessageData(Messages.state(reason))
    }

    detachWorker(): Worker {
        let worker = this._worker;
        this._worker = null
        return worker
    }

    onMessage(msg: MessageEvent) {
        if (!msg.data) console.error("Missing message data", msg)
        else if (!msg.data.type) console.error("Missing message type", msg)
        else this.onMessageData(msg.data as Messages.Base)
    }

    onMessageData(msg: Messages.Base) {
        if (msg.type === Messages.TYPE_STATE) this._state = (msg as Messages.State)
        this._listeners.forEachListener(l => l(msg))
    }
}