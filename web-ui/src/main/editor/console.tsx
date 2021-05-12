import * as React from 'react';
import {Dispatch, SetStateAction} from 'react';
import {Execution} from "./workerExecution";
import {Messages} from "./reportAPI";
import {RComponent} from "./utils";

export const TYPE_INFO = 'info'
export const TYPE_SYS = 'sys'
export const TYPE_ERROR = 'error'

export type MessageType = typeof TYPE_INFO | typeof TYPE_SYS | typeof TYPE_ERROR;

export interface Message {
  readonly elapsed: number
  readonly text: string
  readonly type: MessageType
  readonly report?: {
    id: number
    name: string
    rows: number
  }
  readonly exception?: {
    name: string
    message: string
    stack: string
  }
}

export class Collector {
  private _execution: Execution
  private _unsubscribe: () => void
  private _lastMessages: Message[]

  constructor(private readonly _setMessages: Dispatch<SetStateAction<Message[]>>) {
  }

  static use() {
    const [messages, setMessages] = React.useState<Message[]>([])
    let console = React.useRef(new Collector(setMessages)).current
    React.useEffect(() => () => console.unsubscribe(), []) // Unsubscribe when the component gets unmounted
    console._lastMessages = messages
    return console
  }

  get lastMessages(): Message[] { return this._lastMessages }

  setExecution(exec: Execution) {
    if (this._execution === exec) return
    this.unsubscribe()
    this._lastMessages = []
    this._setMessages([])
    this._execution = exec
    this._unsubscribe = exec.listenMessages(msg => this.onMessage(msg))
    this.onMessage(exec.state)
  }

  private unsubscribe() {
    if (this._unsubscribe) {
      this._unsubscribe()
      this._unsubscribe = null
    }
  }

  private onMessage(msg: Messages.Base) {
    let message: Message
    const elapsed = new Date().getTime() - this._execution.startedOn.getTime()
    switch (msg.type) {
      case Messages.TYPE_STATE: message = Collector.onStateMessage(elapsed, msg as Messages.State); break
      case Messages.TYPE_REPORT: message = Collector.onReportMessage(elapsed, msg as Messages.Report); break
      case Messages.TYPE_DEBUG: message = Collector.onDebugMessage(elapsed, msg as Messages.Debug); break
      case Messages.TYPE_EXCEPTION: message = Collector.onExceptionMessage(elapsed, msg as Messages.Exception); break
      default: console.error("Unsupported message type:", msg.type); return
    }
    this._setMessages(prev => [...prev, message])
  }

  private static onStateMessage(elapsed: number, msg: Messages.State): Message {
    let type
    let text
    if (msg.error) {
      type = TYPE_ERROR
      text = msg.error
    } else {
      type  = TYPE_SYS
      text = msg.running ? 'Started' : 'Finished'
    }
    return { elapsed, type, text }
  }

  private static onReportMessage(elapsed: number, msg: Messages.Report): Message {
    return {
      elapsed, type: TYPE_SYS, text: `Report ${msg.name} ${msg.data.length} rows`,
      report: {id: msg.id, name: msg.name, rows: msg.data.length}
    }
  }

  private static onDebugMessage(elapsed: number, msg: Messages.Debug): Message {
    const type = msg.problem ? TYPE_ERROR : TYPE_INFO
    return {elapsed, type, text: msg.text};
  }

  private static onExceptionMessage(elapsed: number, msg: Messages.Exception): Message {
    return {elapsed, type: TYPE_ERROR, text: 'Exception: ' + msg.message,
      exception: {name: msg.name, message: msg.message, stack: msg.stack}};
  }
}

export const CLASS_ROW = 'row'
export const CLASS_TIME = 'time'
export const CLASS_MESSAGE = 'message'
export const CLASS_EXCEPTION = 'exception'

export type MessageCssType = {
  [type in MessageType | typeof CLASS_ROW | typeof CLASS_TIME | typeof CLASS_MESSAGE | typeof CLASS_EXCEPTION]: string
}

export interface ConsoleProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: Message[],
  /** Calls this callback when the user clicks a report link */
  onReport?: (id: number) => void
  /** Custom message renderer */
  MessageBody?: RComponent<LogMessageProps>
  /** CSS classes for parts of message and message types */
  msgClasses: MessageCssType
}

function displayTime(millis: number) {
  if (millis < 10000) return (millis / 1000).toFixed(3)
  const seconds = Math.round(millis / 1000);
  let min: any = Math.floor(seconds / 60)
  let sec: any = seconds % 60
  if (min < 10) min = '0' + min
  if (sec < 10) sec = '0' + sec
  return `${min}:${sec}`
}

export interface LogMessageProps {
  message: Message
  onReport?: (id: number) => void
  msgClasses: {[type: string]: string}
}

/**
 * Prepares an exception for display
 *  * Header line: <NAME>: <MESSAGE>
 *  * Stacktrace: [<FUNCTION>, <SRC_PATH>, <SRC_FILE_AND_POSITION>]
 * @param name
 * @param message
 * @param stack
 */
export function formatException(name: string, message: string, stack: string): [string, [string, string, string][] | undefined] {
  let header = name ? name : 'UNKNOWN EXCEPTION';
  if (message) header += ': ' + message
  const stackArray: [string, string, string][] = stack ?
      stack.split(/[\n\r]+/)
          .filter(s => s.length > 0)
          .map(line => {
            let index = line.indexOf('@');
            const first = line.substring(0, index);
            let path = line.substring(index + 1);
            index = path.lastIndexOf('/');
            let file;
            if (index >= 0) {
              file = path.substring(index + 1)
              path = path.substring(0, index + 1)
            }
            return [first, path, file]
          })
      : undefined
  return [header, stackArray]
}

export function LogMessage({message, onReport}: LogMessageProps) {
  const report = message.report;
  if (report) {
    let reportName = !onReport ? report.name :
        <a href='' onClick={(e) => {
          e.preventDefault();
          onReport(report.id)
        }}>{report.name}</a>;
    return <>Report {reportName} (rows: {report.rows})</>
  }
  const exception = message.exception
  if (exception) {
    let [header, stack] = formatException(exception.name, exception.message, exception.stack)
    stack = stack.map(([first, ...rest]) => [first.length > 0 ? first : '<anonymous>', ...rest])
    const maxLen = stack.reduce((max, e) => Math.max(max, e[0].length), 0)
    function appendSpaces(s: string) {
      while (s.length < maxLen) s += ' '
      return s
    }
    return <>
      {header + '\n'}
      {stack.map(([first, , file], index) =>
          <React.Fragment key={index}>{'  '}{appendSpaces(first)} {file + '\n'}</React.Fragment>
      )}
    </>
  }
  return message.text
}

export function Component({messages, msgClasses, onReport, MessageBody, ...divProps}: ConsoleProps) {
  if (!MessageBody) MessageBody = LogMessage as RComponent<LogMessageProps>
  return <div {...divProps}>
    {messages.map((msg, index) => {
      let rowTypeClassId;
      if (msg.exception) rowTypeClassId = CLASS_EXCEPTION
      else rowTypeClassId = msg.type
      let rowTypeClass = msgClasses[rowTypeClassId]
      if (!rowTypeClass) rowTypeClass = ''
      return <div key={index} className={`${msgClasses[CLASS_ROW]} ${rowTypeClass}`}>
        <div className={msgClasses[CLASS_TIME]}>{displayTime(msg.elapsed)}</div>
        <div className={msgClasses[CLASS_MESSAGE]}>
          <MessageBody message={msg} onReport={onReport} msgClasses={msgClasses}/>
        </div>
      </div>
    })}
  </div>
}