import {Messages, QueryRequestBuilder, ReportAPI} from "./reportAPI";

const sendMessage = Messages.sendMessage

export function processMessage(event, requestBuilder: QueryRequestBuilder) {
  let execution = new Function("api", event.data);
  let api = new ReportAPI(requestBuilder);
  try {
    execution(api);
    sendMessage(Messages.state(null, false))
  } catch (e) {
    console.log(e)
    sendMessage(Messages.exception(e))
    sendMessage(Messages.state('Failed with exception: ' + e, false))
  }
}