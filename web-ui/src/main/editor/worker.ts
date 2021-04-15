import {ReportAPI} from "./reportAPI";

export function processMessage(event) {
  let execution = new Function("api", event.data);
  let api = new ReportAPI();
  execution(api);
}