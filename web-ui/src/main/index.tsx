import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HelloWorld from './samples/HelloWorld';
import BasicExecutor from "./samples/basicExecution";
import {BasicEditor} from "./editor/basic-editor";
import ServerController from "./samples/serverController";
import {WorkerManager} from "./editor/workerExecution";

document.addEventListener('DOMContentLoaded', () => {
    const workerManager = new WorkerManager('js/worker.execution.js')
    // function f(a: number): string { return '' + a }

    let code = `
    function f(a: number): string { return '' + a }
    A() // Will fail here until the lib is included
    api.table(api.query({}, {}, {_id: 0}, 20, 10, {country: -1}));`
    let content = <>
        <HelloWorld/>
        <BasicExecutor/>
        <BasicEditor workerManager={workerManager} code={code}/>
        <ServerController/>
    </>
    ReactDOM.render(content, document.querySelector('#root'));
});
