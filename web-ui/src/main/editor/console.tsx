import * as React from 'react';
import {Dispatch, SetStateAction} from 'react';
import {Execution} from "./workerExecution";
import {Messages} from "./reportAPI";

export const TYPE_INFO = 'info'
export const TYPE_SYS = 'sys'
export const TYPE_ERROR = 'error'

export interface Message {
  readonly elapsed: number
  readonly text: string
  readonly type: string
}

export class Collector {
  private _execution: Execution
  private _unsubscribe: () => void
  private _startMillis: number = 0
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
    this._startMillis = new Date().getTime()
    this.onMessage(exec.state)
  }

  get startMillis(): number { return this._startMillis }

  private unsubscribe() {
    if (this._unsubscribe) {
      this._unsubscribe()
      this._unsubscribe = null
    }
  }

  private onMessage(msg: Messages.Base) {
    let message: Message
    const elapsed = new Date().getTime() - this._startMillis
    switch (msg.type) {
      case Messages.TYPE_STATE: message = Collector.onStateMessage(elapsed, msg as Messages.State); break
      case Messages.TYPE_REPORT: message = Collector.onReportMessage(elapsed, msg as Messages.Report); break
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

  private static onReportMessage(elapsed: number, msg: Messages.Report) {
    return {elapsed, type: TYPE_SYS, text: `Reported ${msg.data.length} rows`}
  }
}

export const CLASS_ROW = 'row'
export const CLASS_TIME = 'time'
export const CLASS_MESSAGE = 'message'

export interface ConsoleProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: Message[],
  startMillis: number,
  msgClasses: {[type: string]: string}
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

export function Component({messages, startMillis, msgClasses, ...divProps}: ConsoleProps) {
  return <div {...divProps}>
    {messages.map((msg, index) => {
      return <div key={index} className={`${msgClasses[CLASS_ROW]} ${msgClasses[msg.type]}`}>
        <div className={msgClasses[CLASS_TIME]}>{displayTime(msg.elapsed)}</div>
        <div className={msgClasses[CLASS_MESSAGE]}>{msg.text}</div>
      </div>
    })}
  </div>
}