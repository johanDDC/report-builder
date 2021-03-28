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
    const code = "function a(){\n\tconsole.log(123);\n}\n\na(); ";

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
        <button onClick={showCode}>Print code</button>
        <button onClick={() => runCode(editor.getValue())}>
            Run in worker
        </button>
    </>;
}

export default BasicEditor;