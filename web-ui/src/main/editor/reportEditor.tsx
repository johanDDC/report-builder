/// <reference types="babel__core" />
import * as React from 'react';
import {EditorController, Languages} from "./monacoController";
import * as Babel from "@babel/core";

export namespace MIME {
  export const TS = 'application/typescript'
  export const JS = 'application/javascript' // https://tools.ietf.org/html/rfc4329
}

/** Defines code and its language (by MIME type) */
export interface Code {
  mime: string
  text: string
}

export function transpileToJs(code: Code): string {
  if (MIME.JS === code.mime) return code.text
  if (MIME.TS === code.mime)
    return Babel.transform(code.text, {
      filename: 'example.ts', // Workaround https://github.com/babel/babel/issues/10154
      presets: ['typescript']
    }).code
  throw Error("Unknown code MIME type: " + code.mime)
}

export class ReportEditorController {
  private readonly _apiExtensions: {[key: string]: Code} = {}

  constructor(private readonly _controller = new EditorController()) {
  }

  static use(): ReportEditorController {
    return React.useRef(new ReportEditorController()).current
  }

  get code(): Code {
    let codeEditor = this.controller.editor;
    let mime;
    if (codeEditor) {
      let lang = codeEditor.getModel().getModeId();
      if (Languages.typescript === lang) mime = MIME.TS
      else if (Languages.javascript == lang) mime = MIME.JS
      else {
        console.error('Unknown language: ' + lang)
        mime = MIME.TS
      }
    } else {
      console.error('Editor is not ready yet')
      mime = MIME.TS
    }
    return {mime, text: this.controller.codeText}
  }

  get controller() { return this._controller }

  get editor() { return this._controller.editor }

  /**
   * Add/updates/removes an API extension.
   * @param key the identifier of the extension to add/update/remove
   * @param types types definition to be appended to the editor
   *              May be empty/null if the extension does not provide any API (it only executes some start up)
   * @param code extension code to be prepended right before execution
   *               May be empty/null if the extension does not provide any runtime (it only declares some types)
   */
  setApiExtension(key: string, types: string, code: Code) {
    if (code) this._apiExtensions[key] = code
    else delete this._apiExtensions[key]
    this._controller.typescriptLibs.setLibContent(key, types)
  }

  /**
   * @return the whole code of the report builder.
   * Includes API extensions (at the beginning) and the code from the editor (at the end)
   */
  getWholeReportCode(): string {
    let extensions = '';
    Object.keys(this._apiExtensions).sort() // Sort in order to append extensions in some reproducible order
        .forEach(k => {
          if (extensions.length > 0) extensions += '\n'
          extensions += `// Extension: ${k}\n${transpileToJs(this._apiExtensions[k])}`
        })
    let mainPart = transpileToJs(this.code);
    if (extensions.length == 0) return mainPart
    return `${extensions}\n// MAIN PART\n${mainPart}`
  }
}