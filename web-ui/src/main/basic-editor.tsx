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
        <button onClick={() => showCode()}>Print code</button>
        <WorkerExecuter editor={editor}/>
    </>;
}

export default BasicEditor;