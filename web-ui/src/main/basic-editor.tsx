import React, {useRef} from 'react';
// @ts-ignore
import Editor, {Monaco} from "@monaco-editor/react";

const messagesSource = [
    "const messages = {",
    "   add: (message : string) => {}",
    "}"
].join('\n');

function BasicEditor() {
    const editorRef = useRef(null);
    const code = "function a(){\n\tconsole.log(123);\n}";

    const showCode = () => {
        alert(editorRef.current.getValue());
    }

    return <>
        <Editor
            height="200px"
            defaultLanguage="typescript"
            defaultValue={code}
            onMount={(editor, monaco) => {
                editorRef.current = editor;
                monaco.languages.typescript.typescriptDefaults.addExtraLib(messagesSource);
            }}
        />
        <button onClick={() => showCode()}>Print code</button>
    </>;
}

export default BasicEditor;