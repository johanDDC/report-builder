import * as React from 'react';
// @ts-ignore
import * as monaco_loader from '@monaco-editor/loader';
// @ts-ignore
import {editor} from "monaco-editor/monaco";
import {Execution} from "./workerExecution";
import {MonacoEditor} from "./monacoController";
import {WorkerManager} from "./workerExecution";
import {EditorController} from "./monacoController";
import {MIME, ReportEditorController} from "./reportEditor";
// @ts-ignore
import TS = MIME.TS;

const messagesSource = [
    "const messages = {",
    "   add: (message : string) => {}",
    "}"
].join('\n');
import {Messages} from "./reportAPI";
import * as Console from './console'
import {MessageCssType} from './console'
// @ts-ignore
import REPORT_API_TYPES from '!!raw-loader!./types-ReportAPI.d.ts';
// @ts-ignore
import PREDEF from '!!raw-loader!./types2/predef';
import {Mongo} from "./types2/predef";
import Decimal = Mongo.Decimal;
import * as Generator from "./types2/tsGenerator";
import * as Code from "./types2/code";

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

export function downloadCSV(fileName: string, rows: any[], columns?: string[]) {
    if (fileName.indexOf('.') < 0) fileName = fileName + '.csv'
    if (columns == undefined) {
        columns = Object.keys(rows[0]).filter(e => e != "_id");
    }
    let csv = toCSV(rows, formColumns(columns));
    let downloader = document.createElement('a');
    downloader.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    downloader.target = '_blank';
    downloader.download = fileName;
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

export function formatFilename(name: string, date: Date) {
    const FILE_DATE_FORMAT = [{month: 'short'}, {day: '2-digit'}, {hour: '2-digit', hour12: false}, {minute: '2-digit'}]
        .map(f => new Intl.DateTimeFormat('en-US', f))
    let parts = FILE_DATE_FORMAT.map(f => f.format(date));
    parts = [name, ...parts]
    return parts.join('_')
}

export function Table(props: { rows: any[], headColumns?: string[] }) {
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
                row.push(<td key={rowId++}>{stringifyElem(obj[field])}</td>);
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

    function stringifyElem(record: null | object) {
        function parseType(obj: object) {
            if (obj["$date"]) {
                return new Date(obj["$date"]);
            }
            if (obj["$numberDecimal"]) {
                return new Decimal(obj["$numberDecimal"]);
            }
            if (obj["$oid"]) {
                return obj["$oid"];
            }
            return obj;
        }

        if (record == null) {
            return null;
        }
        let elem = parseType(record);
        if (elem == record && record instanceof Object) {     // obj[field] == undefined ?
            return JSON.stringify(record);
        } else {
            if (elem instanceof Decimal) {
                return elem.text;
            } else if (elem instanceof Date) {
                return elem.toLocaleDateString();
            } else if (elem != null) {
                return record.toString();
            }
        }
    }
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

const netflixSchema = {
    collection: "testCollection",
    name: "Netflix",
    query: {_TYPE: "ARecord_Type"},
    "element": {
        "_id": "reference",
        "show_id": "string",
        "type": "string",
        "title": "string",
        "director": "string",
        // "cast": {arr: true, "element": "string"},
        "country": "string",
        "date_added": "datetime",
        "release_year": "int32",
        "rating": "string",
        "duration": {"seasons": "int32", "mins": "int32"},
        // "listed_in": {arr: true, "element": "string"},
        "description": "string",
        "dec": "decimal"
    }
}

const netflixSettings: Generator.Settings = {
    enum: Generator.defaultEnumFieldGenerator,
    primitives: {
        reference: Generator.DEFAULT_ID_FIELD,
        int64: Generator.DEFAULT_NUMBER_FIELD,
        decimal: Generator.DEFAULT_DECIMAL_FIELD,
        dateTime: Generator.createDefaultDateField("DATE_TIME"),
        date: Generator.createDefaultDateField("DATE"),
        string: Generator.DEFAULT_STRING_FIELD,
    }
}

const CONSOLE_CLASSES: MessageCssType = {
    [Console.TYPE_INFO]: 'console-info',
    [Console.TYPE_SYS]: 'console-sys',
    [Console.TYPE_ERROR]: 'console-error',
    [Console.CLASS_ROW]: 'console-row',
    [Console.CLASS_TIME]: 'console-time',
    [Console.CLASS_MESSAGE]: 'console-message',
    [Console.CLASS_EXCEPTION]: 'console-exception',
}

export function BasicEditor({workerManager, code}: { workerManager: WorkerManager, code: string }) {
    const [data, setData] = React.useState([]);
    const [headColumns, setHeadColumns] = React.useState(undefined);
    const [execution, setExecution] = React.useState<Execution>(null)
    const [execState, setExecState] = React.useState<Messages.State>(Messages.state('Not stater', false))
    const editor = ReportEditorController.use()
    const editorTypes = EditorController.use()
    const editorCode = EditorController.use()
    // @ts-ignore
    const log = Console.Collector.use()
    const [showConsole, setShowConsole] = React.useState(true)
    const [addLib, setAddLib] = React.useState(true)

    const generatedTypes = new Code.Builder(2);
    const predef = generatedTypes.appendBlock("namespace Util {", "}");
    predef.append(PREDEF);
    const namspaceNetflix = generatedTypes.appendBlock('namespace _netflix {', '}');
    namspaceNetflix.appendLine(`export const NETFLIX_IMAGE = '${netflixSchema.collection}'`)
    Generator.generateTypes(namspaceNetflix, [netflixSchema], netflixSettings)

    const constNetflix = generatedTypes.appendBlock('const Collection = {', '}')
    Generator.generateBuilderConstants(constNetflix, '_netflix', '_netflix.NETFLIX_IMAGE', [netflixSchema])
    React.useEffect(() => {
        editor.setApiExtension('messageSource', messagesSource, null) // No harm to set the same content several times
        editor.setApiExtension('code', generatedTypes.build(), {text: generatedTypes.build(), mime: TS});
        editor.controller.codeText = code;
        editorTypes.codeText = generatedTypes.build();
        editorCode.codeText = predef.build();
    }, [code])

    const showCode = React.useCallback(() => {
        alert(editor.getWholeReportCode())
    }, [])

    return <>
        <div style={{height: "200px", display: "flex", flexFlow: "row nowrap"}}>
            <MonacoEditor style={{height: "100%", width: "50%"}} language='typescript' controller={editor.controller}/>
            <div style={{height: "100%", width: "50%"}}>
                <h5>Libraries</h5>
                <label>
                    <input type='checkbox' checked={addLib} onChange={
                        (e) => setAddLib(e.target.checked)}/>
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
                log.setExecution(exec)
                exec.start(code);
            }}>
            Run in worker
        </button>
        <button
            onClick={() => downloadCSV(formatFilename('report', execution.startedOn), data)}
            disabled={data.length == 0}>
            Download CSV
        </button>
        <button onClick={() => execution.terminate("Terminated by the user")}
                disabled={!execution || !execState || !execState.running}>
            Terminate
        </button>
        <label>
            Show Console
            <input type='checkbox' checked={showConsole} onChange={(e) => setShowConsole(e.target.checked)}/>
        </label>
        <MaxRowsTextarea/>
        <div style={{width: "100%", display: "flex", flexDirection: "row", height: "400px"}}>
            <MonacoEditor style={{height: "100%", width: "50%"}} language='typescript' controller={editorTypes}/>
            <MonacoEditor style={{height: "100%", width: "50%"}} language='typescript' controller={editorCode}/>
        </div>
        {/*<Table rows={data} headColumns={headColumns}/>*/}
        {showConsole ?
            <Console.Component className='console' msgClasses={CONSOLE_CLASSES} messages={log.lastMessages}
                               onReport={() => setShowConsole(false)}/>
            : <Table rows={data} headColumns={headColumns}/>
        }
    </>;
}