import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HelloWorld from './samples/HelloWorld';
import BasicExecutor from "./samples/basicExecution";
import {BasicEditor} from "./editor/basic-editor";
import ServerController from "./samples/serverController";
import {WorkerManager} from "./editor/workerExecution";

document.addEventListener('DOMContentLoaded', () => {
    const workerManager = new WorkerManager('js/worker.execution.js')
    let content = <>
        <HelloWorld/>
        <BasicExecutor/>
        <BasicEditor workerManager={workerManager} code={"Collection.release_year({greater: 2019, less: 2021}).query()"}/>
        <ServerController/>
    </>
    ReactDOM.render(content, document.querySelector('#root'));
});
