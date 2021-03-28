import React from 'react';

let worker;

function runCode(code: string): Promise<MessageEvent> {
    worker.postMessage(code);
    return new Promise(resolve => worker.onmessage = (response) => resolve(response));
}

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

    setter(
        <table>
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

interface Props {
    editor: { getValue: () => string },
    tableSetter: React.Dispatch<React.SetStateAction<JSX.Element>>,
}

export default function WorkerExecuter(props: Props) {
    if (!worker) {
        if (window.Worker) {
            worker = new Worker("js/worker.execution.js");
        } else {
            alert("Problem with worker initialization");
        }
    }

    return <>
        <button onClick={() => {
            runCode(props.editor.getValue()).then(message => drawTable(props.tableSetter, message.data));
        }}>
            Run in worker
        </button>
    </>
}