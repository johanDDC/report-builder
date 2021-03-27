// import {ReportAPI} from "./reportAPI";
import {ReportAPI} from "./api";

onmessage = event => {
    let execution = new Function("api", event.data);
    let api = new ReportAPI();
    let result = execution(api);
}