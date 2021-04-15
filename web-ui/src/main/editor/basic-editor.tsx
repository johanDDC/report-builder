import React, {useEffect, useRef, useState} from 'react';
// @ts-ignore
import loader from '@monaco-editor/loader';
import runCode from "./workerExecution";

const messagesSource = [
    "const messages = {",
    "   add: (message : string) => {}",
    "}"
].join('\n');

function Table(props: { data: Array<JSON> }) {
    if (props.data.length == 0) {
        return null;
    }
    return <table className="tableContainer">
        <thead>
        <tr>
            {
                Object.keys(props.data[0]).map((col, key) => col != "_id" ? <th key={key}>{col}</th> : null)
            }
        </tr>
        </thead>
        <tbody>
        {props.data.map((obj, key) => {
            let row = [];
            let id = 0;
            for (let field of Object.keys(obj)) {
                if (field !== "_id") {
                    let elem;
                    if (obj[field] instanceof Object) {
                        elem = JSON.stringify(obj[field]);
                    } else {
                        elem = obj[field];
                    }
                    row.push(<td key={id++}>{elem}</td>);
                }
            }
            return <tr key={key}>{row}</tr>
        })}
        </tbody>
    </table>;
}


export function BasicEditor() {
    const editorContainer = useRef(null);
    const [data, setData] = useState([]);
    const [editor, setEditor] = useState(null);
    const code = "let result = api.query({});\n" +
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
        <Table data={data}/>
    </>;
}