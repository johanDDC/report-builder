import React, {useState} from "react";

function executer(code: string) {
    return new Function("messages", code);
}

export default function BasicExecutor() {
    const [log, setLog] = useState([]);
    let logCopy = log;
    let f = executer("messages.add('Hello'); messages.add('World!');");
    const messages = {
        add: (message: string) => {
            logCopy = [...logCopy, message];
            setLog(logCopy);
        }
    };
    return <>
        <button onClick={() => f(messages)}>
            Run
        </button>
        <button onClick={() => setLog([])}>Clear</button>
        {log.map((val, key) => <div key={key}>{val}</div>)}
    </>;
}