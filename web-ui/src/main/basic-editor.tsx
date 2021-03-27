import React, {useEffect, useRef, useState} from 'react';
// @ts-ignore
import loader from '@monaco-editor/loader';
import WorkerExecuter from "./workerExecution";

const messagesSource = [
    "const messages = {",
    "   add: (message : string) => {}",
    "}"
].join('\n');

function BasicEditor() {
    const editorContainer = useRef(null);
    // const tableContainer = useRef(null);
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
        <WorkerExecuter editor={editor} tableSetter={setTable}/>
        {table}
    </>;
}

export default BasicEditor;