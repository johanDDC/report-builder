import {Messages, QueryRequestBuilder, ReportAPI} from "./reportAPI";

export function processMessage(event, requestBuilder: QueryRequestBuilder) {
  let execution = new Function("api", event.data);
  let api = new ReportAPI(requestBuilder);
  try {
    execution(api);
    // @ts-ignore
    postMessage(Messages.state(null, false))
  } catch (e) {
    console.log(e)
    // @ts-ignore
    postMessage(Messages.exception(e))
    // @ts-ignore
    postMessage(Messages.state('Failed with exception: ' + e, false))
  }
}