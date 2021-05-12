import * as BasicEditor from "../src/main/editor/basic-editor";

export * as Execution from "../src/main/editor/workerExecution"
export * as IDE from '../src/main/editor/reportEditor'
export * as Console from '../src/main/editor/console'
export * as Monaco from '../src/main/editor/monacoController'

export namespace CSV {
  export const toCSV = BasicEditor.toCSV
  export const downloadCSV = BasicEditor.downloadCSV
  export const formatFilename = BasicEditor.formatFilename
}

export namespace Other {
  export const Table = BasicEditor.Table
}