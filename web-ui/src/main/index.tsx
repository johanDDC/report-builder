import React from 'react';
import ReactDOM from 'react-dom';
import HelloWorld from './HelloWorld';
import BasicExecutor from "./basicExecution";
import BasicEditor from "./basic-editor";
import ServerController from "./serverController";

document.addEventListener('DOMContentLoaded', () => {
    let content = <>
        <HelloWorld/>
        <BasicExecutor/>
        <BasicEditor/>
        <ServerController/>
    </>
    ReactDOM.render(content, document.querySelector('#root'));
});
