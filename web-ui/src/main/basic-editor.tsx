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


function BasicEditor() {
    const editorContainer = useRef(null);
    const [data, setData] = useState([]);
    const [editor, setEditor] = useState(null);
    // const code = "function a(){\n\tconsole.log(123);\n}\n\na(); ";
    const code = "api.table([{\"_id\": {\"timestamp\": 1615836987, \"counter\": 2698868, \"randomValue1\": 4797697, \"randomValue2\": 29416}, \"show_id\": \"s1781\", \"type\": \"TV Show\", \"title\": \"Disenchantment\", \"cast\": [\"Abbi Jacobson\", \" Eric André\", \" Nat Faxon\", \" John DiMaggio\", \" Tress MacNeille\", \" Matt Berry\", \" David Herman\", \" Maurice LaMarche\", \" Lucy Montgomery\", \" Billy West\"], \"country\": \"United States\", \"date_added\": \"Jan 15, 2021, 12:00:00 AM\", \"release_year\": 2021, \"rating\": \"TV-14\", \"duration\": {\"seasons\": 3}, \"listed_in\": [\"TV Action \u0026 Adventure\", \" TV Comedies\", \" TV Sci-Fi \u0026 Fantasy\"], \"description\": \"Princess duties call, but she\u0027d rather be drinking. Free-spirited Bean exasperates the king as she wreaks havoc with her demon and elf pals.\"}])";

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