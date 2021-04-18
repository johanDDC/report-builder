import * as React from 'react';
// @ts-ignore
import * as monaco_loader from '@monaco-editor/loader';
// @ts-ignore
import {editor} from "monaco-editor/monaco";
import {Execution, WorkerManager} from "./workerExecution";
import {MonacoEditor} from "./monacoController";
import {MIME, ReportEditorController} from "./reportEditor";
import {Messages} from "./reportAPI";

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
        csv += escape(columns[i].header);
    }
    csv += "\r\n";
    for (let row of rows) {
        for (let i = 0; i < columns.length; i++) {
            let column = columns[i];
            if (i > 0) {
                csv += ',';
            }
            csv += escape(column.renderer(row));
        }
        csv += "\r\n";
    }
    return csv;

    function escape(field: string) {
        if (typeof field == "string") {
            field = field.replace(/"/g, '""')
        }
        if (field.indexOf("\"") >= 0 || field.indexOf(",") >= 0 || field.indexOf("\n") >= 0 || field.indexOf("\r") >= 0) {
            field = "\"" + field + "\"";
        }
        return field;
    }
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
                    if (typeof value == "object") {
                        return JSON.stringify(value);
                    }
                    return '' + value;
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
        <thead>
        <tr>
            {
                columns.map((col, key) => <th key={key}>{col}</th>)
            }
        </tr>
        </thead>
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

const JS_SLEEP =
`function sleep(t) {
  const start = Date.now();
  while (Date.now() - start < t);
}`

export function BasicEditor({workerManager, code}: { workerManager: WorkerManager, code: string }) {
    const [data, setData] = React.useState([]);
    const [headColumns, setHeadColumns] = React.useState(undefined);
    const [execution, setExecution] = React.useState<Execution>(null)
    const [execState, setExecState] = React.useState<Messages.State>(Messages.state('Not stater', false))
    const editor = ReportEditorController.use()
    React.useEffect(() => {
        editor.setApiExtension('messageSource', messagesSource, null) // No harm to set the same content several times
        editor.controller.codeText = code
    }, [code])

    const showCode = React.useCallback(() => {
        alert(editor.getWholeReportCode())
    }, [])

    return <>
        <div style={{height: "200px", display: "flex", flexFlow: "row nowrap"}}>
            <MonacoEditor style={{flexGrow: 1, width: "50%"}} language='typescript' controller={editor.controller}/>
            <div style={{height: "100%", flexGrow: 0, minWidth: "8em", marginLeft: ".5rem"}}>
                <h5 style={{margin: ".1em .3em .1em .5em"}}>Libraries</h5>
                <label>
                    <input type='checkbox' onChange={
                        (e) => {
                            if (e.target.checked)
                                editor.setApiExtension('lib-sleep', 'function sleep(time: number)', {mime: MIME.JS, text: JS_SLEEP})
                            else editor.setApiExtension('lib-sleep', null, null)
                        }}/>
                    sleep()
                </label>
            </div>
        </div>
        <button onClick={showCode}>Print code</button>
        <button
            onClick={() => {
                let code = editor.getWholeReportCode();
                let exec = workerManager.newExecution();
                setExecution(exec)
                setData([])
                setHeadColumns(undefined)
                setExecState(exec.state)
                exec.listenMessages(m => {
                    const msg = m as Messages.Report
                    setData(msg.data)
                    setHeadColumns(msg.columns)
                }, Messages.TYPE_REPORT)
                exec.listenMessages(m => setExecState(m as Messages.State), Messages.TYPE_STATE)
                exec.start(code)
            }}>
            Run in worker
        </button>
        <button
            onClick={() => downloadCSV(data)}
            disabled={data.length == 0}>
            Download CSV
        </button>
        <button onClick={() => execution.terminate("Terminated by the user")}
                disabled={!execution || !execState || !execState.running}>
            Terminate
        </button>
        <MaxRowsTextarea/>
        <Table rows={data} headColumns={headColumns}/>
    </>;
}