import React, {FunctionComponent} from "react";

//  what is the type of context?
interface Props {
    codeExecuter: Function,
    context: any
}

const RunButton : FunctionComponent<Props> = (props: Props) =>
    <button onClick={() => props.codeExecuter(props.context)}>Run</button>

export default RunButton;