import {ReportAPI} from "./reportAPI";

onmessage = event => {
    let execution = new Function("api", event.data);
    let api = new ReportAPI();
    execution(api);
}