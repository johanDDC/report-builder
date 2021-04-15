import React, {useEffect, useRef, useState} from 'react';
// @ts-ignore
import loader from '@monaco-editor/loader';
import runCode from "./workerExecution";
import {TableConfig} from "./reportAPI";

const messagesSource = [
    "const messages = {",
    "   add: (message : string) => {}",
    "}"
].join('\n');

function toCSV<T>(rows: T[], columns: { header: string, renderer: (t: T) => string }[]): string {
    let csv = "";
    for (let headCol of columns) {
        csv += headCol + ',';
    }
    csv += "\r\n";
    for (let row of rows) {
        for (let column of columns) {
            csv += column.renderer(row[column.header]) + ',';
        }
        csv += "\r\n";
    }
    return csv;
}

function downloadCSV(rows: any[], columns?: string[]) {
    if (columns == undefined) {
        columns = Object.keys(rows[0]).filter(e => e != "_id");
    }
    let csv = toCSV(rows, formColumns(columns));
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
                    if (val instanceof Array) {
                        return JSON.stringify(val.join(','));
                    } else {
                        return JSON.stringify(val);
                    }
                },
            })
        }
        return columns;
    }
}

function Table(props: { message: any[], config?: TableConfig }) {
    // let rowsToView = (maxRows != undefined && maxRows >= 0) ? maxRows : 5;
    let columns, rows;
    if (props.config == undefined) {
        columns = [];
        rows = 5;
    } else {
        columns = props.config.columns;
        rows = props.config.rowsToView
    }
    if (props.message.length == 0) {
        return null;
    }
    if (columns.length == 0) {
        columns = Object.keys(props.message[0]);
        columns = columns.filter(e => e != "_id");
    }
    return <table className="tableContainer">
        <tbody>
        {props.message.map((obj, key) => {
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
    const [data, setData] = useState([]);
    const [tableConfig, setTableConfig] = useState(undefined);
    const [editor, setEditor] = useState(null);
    const code = "api.table(api.query({}));";

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
            onClick={() => runCode(editor.getValue()).then(message => {
                setData(message.data.data);
                setTableConfig(message.data.config);
            })}>
            Run in worker
        </button>
        <button
            onClick={() => downloadCSV(data)}>
            Download CSV
        </button>
        <Table message={data} config={tableConfig}/>
    </>;
}

export default BasicEditor;