import {processMessage} from "./worker";

onmessage = event => {
    processMessage(event)
}