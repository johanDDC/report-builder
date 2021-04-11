import React, {useEffect, useRef, useState} from 'react';
// @ts-ignore
import loader from '@monaco-editor/loader';
import runCode from "./workerExecution";
import {EMPTY_CONFIG, TableConfig} from "./reportAPI";

const messagesSource = [
    "const messages = {",
    "   add: (message : string) => {}",
    "}"
].join('\n');

function Table(props: { message: { data: Array<any>, config: TableConfig } }) {
    let columns = props.message.config.columns;
    let rows = props.message.config.rowsToView
    if (props.message.data.length == 0 || columns.length == 0) {
        return null;
    }
    return <table className="tableContainer">
        <thead>
        <tr>
            {
                columns.map((colName, key) => <th key={key}>{colName}</th>)
            }
        </tr>
        </thead>
        <tbody>
        {props.message.data.map((obj, key) => {
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
    const [data, setData] = useState({data: [], config: EMPTY_CONFIG});
    const [editor, setEditor] = useState(null);
    const code = "let config = {\n" +
        "\tcolumns: [\"show_id\", \"type\", \"title\", \"director\", \"cast\", \"country\", \"duration\", \"description\"],\n" +
        "\trowsToView : 10,\n}\n\n" +
        "let result = api.query({});\n" +
        "api.configure(config);\n" +
        "api.table(result);";

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
            onClick={() => runCode(editor.getValue()).then(message => setData(message.data))}>
            Run in worker
        </button>
        <Table message={data}/>
    </>;
}

export default BasicEditor;