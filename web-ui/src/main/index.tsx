import React from 'react';
import ReactDOM from 'react-dom';
import HelloWorld from './HelloWorld';
import BasicExecutor from "./basicExecution";
import BasicEditor from "./basic-editor";

import "./alm-crm.css"

document.addEventListener('DOMContentLoaded', () => {
    let content = <>
        <HelloWorld/>
        <BasicExecutor/>
        <BasicEditor/>
    </>
    ReactDOM.render(content, document.querySelector('#root'));
});
