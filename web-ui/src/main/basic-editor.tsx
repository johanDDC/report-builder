import React, {useEffect, useRef} from 'react';
// @ts-ignore
import loader from '@monaco-editor/loader';

const messagesSource = [
    "const messages = {",
    "   add: (message : string) => {}",
    "}"
].join('\n');

function BasicEditor() {
    const editorContainer = useRef(null);
    const code = "function a(){\n\tconsole.log(123);\n}";
    let editor;

    const showCode = () => {
        alert(editor.getValue());
    }

    useEffect(() => {
        if (editorContainer.current) {
            loader.init().then(monaco => {
                monaco.languages.typescript.typescriptDefaults.addExtraLib(messagesSource)
                editor = monaco.editor.create(editorContainer.current, {
                    value: code,
                    language: 'typescript',
                });
            });
        }
    }, []);

    return <>
        <div className="basic-editor" ref={editorContainer}></div>
        <button onClick={() => showCode()}>Print code</button>
    </>;
}

export default BasicEditor;