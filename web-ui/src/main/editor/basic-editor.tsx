import * as React from 'react';
// @ts-ignore
import * as monaco_loader from '@monaco-editor/loader';
// @ts-ignore
import {editor} from "monaco-editor/monaco";
import {WorkerManager} from "./workerExecution";

const messagesSource = [
    "const messages = {",
    "   add: (message : string) => {}",
    "}"
].join('\n');

export function toCSV<T>(rows: T[], columns: { header: string, renderer: (t: T) => string }[]): string {
    /* https://tools.ietf.org/html/rfc4180#page-2 */
    let csv = "";
    for (let i = 0; i < columns.length; i++) {
        if (i > 0) {
            csv += ',';
        }
        csv += columns[i].header;
    }
    csv += "\r\n";
    for (let row of rows) {
        for (let i = 0; i < columns.length; i++) {
            let column = columns[i];
            if (i > 0) {
                csv += ',';
            }
            csv += column.renderer(row);
        }
        csv += "\r\n";
    }
    return csv;
}

function downloadCSV(rows: any[], columns?: string[]) {
    if (columns == undefined) {
        columns = Object.keys(rows[0]).filter(e => e != "_id");
    }
    console.log(formColumns(columns));
    let csv = toCSV(rows, formColumns(columns));
    console.log(csv.slice(0, 3000));
    var downloader = document.createElement('a');
    downloader.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    downloader.target = '_blank';
    downloader.download = 'report.csv';
    downloader.click();

    function formColumns<T>(header: string[]): { header: string, renderer: (t: T) => string }[] {
        let columns = [];
        for (let col of header) {
            columns.push({
                header: col,
                renderer: (val: T) => {
                    let value = val[col];
                    if (value instanceof Array) {
                        return JSON.stringify(value.join(','));
                    } else {
                        return JSON.stringify(value);
                    }
                },
            })
        }
        return columns;
    }
}

function Table(props: { rows: any[], headColumns?: string[] }) {
    if (props.rows.length == 0) {
        return null;
    }
    let tableRows = localStorage.getItem("maxRows") == null
        ? 5
        : JSON.parse(localStorage.getItem("maxRows"));
    let columns = (props.headColumns != undefined)
        ? props.headColumns
        : Object.keys(props.rows[0]).filter(e => e != "_id");
    return <table className="tableContainer">
        <tbody>
        {props.rows.map((obj, key) => {
            if (key >= tableRows) {
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

function MaxRowsTextarea() {
    const [maxRows, setMaxRows] = React.useState(localStorage.getItem("maxRows") != null
        ? JSON.parse(localStorage.getItem("maxRows"))
        : 5);
    if (localStorage.getItem("maxRows") == null) {
        localStorage.setItem("maxRows", JSON.stringify(5));
    }


    return <input maxLength={3} type="number" min={1} max={100} value={maxRows}
                  onChange={(val) => {
                      setMaxRows(val.target.value);
                      localStorage.setItem("maxRows", JSON.stringify(val.target.value))
                  }}/>;
}

export function BasicEditor({workerManager, code}: { workerManager: WorkerManager, code: string }) {
    const editorContainer = React.useRef(null);
    const [data, setData] = React.useState([]);
    const [headColumns, setHeadColumns] = React.useState(undefined);
    const [editor, setEditor]: [editor.IStandaloneCodeEditor, (e: editor.IStandaloneCodeEditor) => void] = React.useState(null);

    const showCode = () => {
        alert(editor.getValue());
    }

    React.useEffect(() => {
        if (editorContainer.current) {
            const loader = monaco_loader as any; // Workaround of wrong default export
            loader.init().then(monaco => {
                monaco.languages.typescript.typescriptDefaults.addExtraLib(messagesSource)
                setEditor(monaco.editor.create(editorContainer.current, {
                    language: 'typescript',
                }));
            });
        }
    }, []);
    React.useEffect(() => {
        if (editor) editor.setValue(code)
    }, [editor, code])

    return <>
        <div className="basic-editor" ref={editorContainer}/>
        <button onClick={showCode}>Print code</button>
        <button
            onClick={() => workerManager.runCode(editor.getValue()).then(message => {
                setData(message.data.data);
                setHeadColumns(message.data.headColumns);
            })}>
            Run in worker
        </button>
        <button
            onClick={() => downloadCSV(data)}
            disabled={data.length == 0}>
            Download CSV
        </button>
        <MaxRowsTextarea/>
        <Table rows={data} headColumns={headColumns}/>
    </>;
}