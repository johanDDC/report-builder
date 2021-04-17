import * as React from 'react';
import {EditorController} from "./monacoController";

export class ReportEditorController {
  private readonly _apiExtensions: {[key: string]: string} = {}

  constructor(private readonly _controller = new EditorController()) {
  }

  static use(): ReportEditorController {
    return React.useRef(new ReportEditorController()).current
  }

  get controller() { return this._controller }

  get editor() { return this._controller.editor }

  /**
   * Add/updates/removes an API extension.
   * @param key the identifier of the extension to add/update/remove
   * @param types types definition to be appended to the editor
   *              May be empty/null if the extension does not provide any API (it only executes some start up)
   * @param jsCode extension code to be prepended right before execution
   *               May be empty/null if the extension does not provide any runtime (it only declares some types)
   */
  setApiExtension(key: string, types: string, jsCode: string) {
    if (jsCode) this._apiExtensions[key] = jsCode
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
          extensions += `// Extension: ${k}\n${this._apiExtensions[k]}`
        })
    let mainPart = this._controller.codeText;
    if (extensions.length == 0) return mainPart
    return `${extensions}\n// MAIN PART\n${mainPart}`
  }
}