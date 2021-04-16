import {processMessage} from "./worker";
import {HttpQueryRequest, MongoQuery} from "./reportAPI"

function buildRequest(query: MongoQuery): HttpQueryRequest {
    return {
        url: '/rest/api/v1/db/testCollection/query/',
        payload: {query: query.query}
    }
}

onmessage = event => {
    processMessage(event, buildRequest)
}