import React from 'react';
import ReactDOM from 'react-dom';
import HelloWorld from './HelloWorld';
import BasicExecutor from "./basicExecution";

document.addEventListener('DOMContentLoaded', () => {
    let content = <>
        <HelloWorld/>
        <BasicExecutor/>
    </>
    ReactDOM.render(content, document.querySelector('#root'));
});
