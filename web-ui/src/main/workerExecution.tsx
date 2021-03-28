let worker;

export default function runCode(code: string): Promise<MessageEvent> {
    worker.postMessage(code);
    return new Promise(resolve => worker.onmessage = (response) => resolve(response));
}
