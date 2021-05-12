import * as React from 'react';
import * as monaco_loader from '@monaco-editor/loader';
// @ts-ignore
import * as MMonaco from "monaco-editor/monaco";
import {Listeners} from "./utils";

export type Monaco = typeof MMonaco

/**
 * These languages are:
 * enumerated in Monaco monaco.languages.getLanguages()
 * returned by editor.getModel().getModelId()
 */
export namespace Languages {
  export const typescript = 'typescript'
  export const javascript = 'javascript'
}

/**
 * Enables control over extra libs
 */
export interface ExtraLibs {
  /**
   * Adds new / Changes contents of / Deletes an extra lib
   * Subsequent updates of the same library (the same key) with the same content are cheap and have no effect (actually do nothing at all)
   * @param key identifiers the lib to update.
   *            If there is no lib - a new one is added
   *            If a lib with the key has been added - its content gets updated (or lib gets deleted)
   * @param content new content of the ext lib. If content is null/undefined/empty string - the lib gets deleted
   */
  setLibContent(key: string, content: string)
}

class ExtraLibsImpl implements ExtraLibs {
  private readonly _libs: {[k: string]: {content: string, dispose: MMonaco.IDisposable}} = {}

  constructor(private readonly _addLib: (content: string) => MMonaco.IDisposable) {
  }

  setLibContent(key: string, content?: string) {
    let known = this._libs[key];
    if (known) {
      if (known.content === content) return
      if (known.dispose) known.dispose.dispose()
      delete this._libs[key]
    }
    if (content)
      this._libs[key] = {content, dispose: this._addLib(content)}
  }

  addAllLibs() {
    for (let k in this._libs) {
      let lib = this._libs[k];
      if (!lib.dispose) {
        lib.dispose = this._addLib(lib.content)
      }
    }
  }
}

/**
 * Controls lifecycle of monaco
 */
export namespace MonacoController {
  let _monaco: Monaco;
  let _promise: Promise<Monaco>
  const _listeners = new Listeners<(m: Monaco) => void>()
  const _extraLibs: {[lang: string]: ExtraLibsImpl} = {}

  export function addListener(l: (m: Monaco) => void) {
    return _listeners.addListener(l)
  }

  /**
   * Provides control over typescript extra libs. The libs can be updated even before monaco is initialized
   */
  export function typescriptLibs(): ExtraLibs {
    return getExtraLibs(Languages.typescript, (c) => {
      if (!_monaco) return null;
      return _monaco.languages.typescript.typescriptDefaults.addExtraLib(c)
    })
  }

  function getExtraLibs(language: string, addLib: (c: string) => MMonaco.IDisposable): ExtraLibs {
    let libs = _extraLibs[language];
    if (!libs) {
      libs = new ExtraLibsImpl(addLib)
      _extraLibs[language] = libs
    }
    return libs
  }

  /**
   * Starts init and provides monaco as a Promise
   */
  export function getPromise(): Promise<Monaco> {
    if (_monaco) return Promise.resolve(_monaco)
    let promise = new Promise<Monaco>((resolve) => {
      let remove = addListener(m => {
        remove();
        resolve(m);
      });
    });
    startInit()
    return promise
  }

  /**
   * Starts init if monaco is not initialized yet
   */
  export function startInit() {
    if (_monaco || _promise) return
    const loader = monaco_loader as any; // Workaround of wrong default export
    _promise = loader.init();
    _promise.then(monaco => {
      _promise = null;
      onInitDone(monaco)
    }).catch(() => {
      _promise = null
    })
  }

  function onInitDone(m: Monaco) {
    _monaco = m;
    _listeners.forEachListener(l => l(_monaco))
    for (let l in _extraLibs)
      _extraLibs[l].addAllLibs()
  }
}

/**
 * Controls an instance of monaco editor.
 * If the instance has not been initialized yet, this class will apply updates as soon as the editor instance appears
 */
export class EditorController {
  private _editor: MMonaco.IStandaloneCodeEditor
  private _element: HTMLElement
  private _futureState: {code?: string} = {}

  constructor() {}

  static use(): EditorController {
    let controller = React.useRef(new EditorController());
    return controller.current
  }

  /**
   * @return the editor instance if it has been created
   */
  get editor(): MMonaco.IStandaloneCodeEditor {
    return this._editor
  }

  /**
   * @return current code from the editor, or initial code set for not-yet-created instance
   */
  get codeText(): string {
    return this._editor ? this._editor.getValue() : this._futureState.code
  }

  /**
   * Updates current text in the editor (or saves to set it as soon as the editor is created)
   */
  set codeText(text: string) {
    this._futureState.code = text
    if (this._editor) this._editor.setValue(text)
  }

  /**
   * Provides control over extra libs
   */
  get typescriptLibs(): ExtraLibs {
    return MonacoController.typescriptLibs()
  }

  /**
   * Creates an editor instance hosted at the specified DOM element
   * @param element
   * @param opt options of the new instance
   */
  attach(element: HTMLElement, opt: MMonaco.IStandaloneEditorConstructionOptions) {
    if (this._editor || this._element) throw Error('Already has the editor')
    this._element = element
    MonacoController.getPromise().then(m => {
      if (!this._element) return
      this.onEditorCreated(m.editor.create(element, opt))
    })
  }

  /**
   * Disposes the current editor instance (if any exists)
   */
  dispose() {
    if (this._element) {
      if (this._editor) this._editor.dispose()
      this._editor = null
      this._element = null
    }
  }

  private onEditorCreated(editor: MMonaco.IStandaloneCodeEditor) {
    this._editor = editor;
    if (this._futureState.code) this._editor.setValue(this._futureState.code)
  }
}

export interface EditorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** configured language of the editor */
  language: string
  /**
   *  Editor controller to connect to the editor.
   *  If a caller provides different instance, the previous controller will be disposed and the new one will be attached.
   */
  controller: EditorController
}

/**
 * <h3>Usage</h3>
 * <pre>
 *   const editor = EditorController.use();
 *   useEffect(() => {
 *     editor. // Initialize the editor
 *   }, []); // Don't forget to set empty dependencies
 *   return <>
 *     <MonacoEditor editorRef={editor} controller={editor} language='typescript'/>
 *     <input onChange={() => editor.}/> // Control the editor
 *     </>
 * </pre>
 * @param language
 * @param editorRef
 * @param props setup the DIV element
 * @constructor
 */
export function MonacoEditor({language, controller, ...props}: EditorProps) {

  const divRef = React.useRef<HTMLDivElement>();
  React.useEffect(() => {
    controller.attach(divRef.current, {language: language})
    return () => controller.dispose()
  }, [controller])
  return <div {...props} ref={divRef}/>
}