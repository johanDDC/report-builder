import React, {useEffect, useRef, useState} from 'react';
// @ts-ignore
import loader from '@monaco-editor/loader';
import runCode from "./workerExecution";

const messagesSource = [
    "const messages = {",
    "   add: (message : string) => {}",
    "}"
].join('\n');

function drawTable(setter: React.Dispatch<React.SetStateAction<JSX.Element>>, data: Array<JSON>) {
    /**
     *
     * @param element: value of JSON. May be either string, number, array or object;
     * @param cumulativeArr: array with "primitive elements". Filling recursively, contains items which will be presented in a cell of a table;
     * @param layout: boolean val. Indicator: is it necessary to parse the content of the array (for multidimensional arrays);
     */
    function addEntry(element: any, cumulativeArr: Array<string>, layout = 0) {
        if (element instanceof Array && !(element[0] instanceof Object)) {
            if (layout == 0) {
                for (let el of element) {
                    addEntry(el, cumulativeArr);
                }
            } else {
                cumulativeArr.push(JSON.stringify(element));
                return;
            }
        } else if (element instanceof Array && element[0] instanceof Object) {
            for (let el of element) {
                addEntry(el, cumulativeArr, 1);
            }
        } else if (element instanceof Object) {
            cumulativeArr.push(JSON.stringify(element));
        } else {
            cumulativeArr.push(element);
        }
    }

    setter(<table>
            <thead>
            <tr>
                {
                    Object.keys(data[0]).map((col, key) => col != "_id" ? <th key={key}>{col}</th> : null)
                }
            </tr>
            </thead>
            <tbody>
            {data.map((obj, key) => {
                let row = [];
                let id = 0;
                for (let field of Object.keys(obj)) {
                    if (field !== "_id") {
                        let elements = [];
                        addEntry(obj[field], elements);
                        row.push(<td key={id++}>{elements.join(", ")}</td>);
                    }
                }
                return <tr key={key}>{row}</tr>
            })}
            </tbody>
        </table>);
}

function BasicEditor() {
    const editorContainer = useRef(null);
    const [editor, setEditor] = useState(null);
    const [table, setTable] = useState(<table className="tableContainer"></table>);
    // const code = "let result = api.query({});\napi.table(result);";
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
        <div className="basic-editor" ref={editorContainer}></div>
        <button onClick={() => showCode()}>Print code</button>
        <button
            onClick={() => runCode(editor.getValue()).then(message => drawTable(setTable, message.data))}>
            Run in worker
        </button>
        {table}
    </>;
}

export default BasicEditor;