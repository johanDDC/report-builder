import React, {useEffect, useRef, useState} from 'react';
// @ts-ignore
import loader from '@monaco-editor/loader';
import runCode from "./workerExecution";
import {TableConfig} from "./reportAPI";

const messagesSource = [
    "const messages = {",
    "   add: (message : string) => {}",
    "}"
].join('\n');

function Table(props: { message: any[], config?: TableConfig }) {
    let columns, rows;
    if (props.config == undefined) {
        columns = [];
        rows = 5;
    } else {
        columns = props.config.columns;
        rows = props.config.rowsToView
    }
    if (props.message.length == 0) {
        return null;
    }
    if (columns.length == 0) {
        columns = Object.keys(props.message[0]);
        columns = columns.filter(e => e != "_id");
    }
    return <table className="tableContainer">
        <tbody>
        {props.message.map((obj, key) => {
            if (key > rows) {
                return null;
            }
            let row = [];
            let rowId = 0;
            for (let field of columns) {
                let elem;
                if (obj[field] instanceof Object) {     // obj[field] == undefined ?
                    elem = JSON.stringify(obj[field]);
                } else {
                    elem = obj[field];
                }
                row.push(<td key={rowId++}>{elem}</td>);
            }
            return <tr key={key}>{row}</tr>
        })}
        </tbody>
    </table>;
}


function BasicEditor() {
    const editorContainer = useRef(null);
    const [data, setData] = useState([]);
    const [tableConfig, setTableConfig] = useState(undefined);
    const [editor, setEditor] = useState(null);
    const code = "api.table(api.query({}));";

    const showCode = () => {
        alert(editor.getValue());
    }

    useEffect(() => {
        if (editorContainer.current) {
            loader.init().then(monaco => {
                monaco.languages.typescript.typescriptDefaults.addExtraLib(messagesSource)
                setEditor(monaco.editor.create(editorContainer.current, {
                    value: code,
                    language: 'typescript',
                }));
            });
        }
    }, []);

    return <>
        <div className="basic-editor" ref={editorContainer}/>
        <button onClick={showCode}>Print code</button>
        <button
            onClick={() => runCode(editor.getValue()).then(message => {
                setData(message.data.data);
                setTableConfig(message.data.config);
            })}>
            Run in worker
        </button>
        <Table message={data} config={tableConfig}/>
    </>;
}

export default BasicEditor;