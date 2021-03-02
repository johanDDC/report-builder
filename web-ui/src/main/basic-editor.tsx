import React from 'react';
// @ts-ignore
import Editor from "@monaco-editor/react";

function BasicEditor() {
    const code = "function a(){}";
    return <Editor
        height="90vh"
        defaultLanguage="javascript"
        defaultValue={code}
    />;
}

export default BasicEditor;