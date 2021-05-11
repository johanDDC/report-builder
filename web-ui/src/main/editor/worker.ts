import {QueryRequestBuilder, ReportAPI} from "./reportAPI";

export function processMessage(event, requestBuilder: QueryRequestBuilder) {
  let execution = new Function("api", event.data.code);
  let api = new ReportAPI(requestBuilder, event.data.scheme);
  execution(api);
}