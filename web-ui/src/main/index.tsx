import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HelloWorld from './samples/HelloWorld';
import BasicExecutor from "./samples/basicExecution";
import {BasicEditor} from "./editor/basic-editor";
import ServerController from "./samples/serverController";

document.addEventListener('DOMContentLoaded', () => {
    let content = <>
        <HelloWorld/>
        <BasicExecutor/>
        <BasicEditor/>
        <ServerController/>
    </>
    ReactDOM.render(content, document.querySelector('#root'));
});
