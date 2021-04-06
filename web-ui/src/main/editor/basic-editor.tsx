import React, {useEffect, useRef, useState} from 'react';
// @ts-ignore
import loader from '@monaco-editor/loader';
import runCode from "./workerExecution";

const messagesSource = [
    "const messages = {",
    "   add: (message : string) => {}",
    "}"
].join('\n');

function Table(props: { data: { columns: Array<string>, query: Array<JSON> } }) {
    let columns = props.data.columns;
    let query = props.data.query;
    if (query.length == 0) {
        return null;
    }
    return <table className="tableContainer">
        <thead>
        <tr>
            {
                columns.map((col, key) => col != "_id" ? <th key={key}>{col}</th> : null)
            }
        </tr>
        </thead>
        <tbody>
        {query.map((obj, key) => {
            let row = [];
            let id = 0;
            for (let field of columns) {
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


function BasicEditor() {
    const editorContainer = useRef(null);
    const [data, setData] = useState({columns: [], query: []});
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

export default BasicEditor;