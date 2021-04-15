import {QueryRequestBuilder, ReportAPI} from "./reportAPI";

export function processMessage(event, requestBuilder: QueryRequestBuilder) {
  let execution = new Function("api", event.data);
  let api = new ReportAPI(requestBuilder);
  execution(api);
}