import React, {useRef} from 'react';
// @ts-ignore
import Editor from "@monaco-editor/react";

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
            onMount={(editor) => {
                editorRef.current = editor;
            }}
        />
        <button onClick={() => showCode()}>Print code</button>
    </>;
}

export default BasicEditor;