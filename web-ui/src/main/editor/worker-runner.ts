import {processMessage} from "./worker";
import {HttpQueryRequest, MongoQuery} from "./reportAPI"

function buildRequest(query: MongoQuery): HttpQueryRequest {
    let payload = {
        query: query.query,
        projection: query.projection,
        limit: query.limit,
        offset: query.offset,
        sort: query.sort,
    };
    return {
        url: '/rest/api/v1/db/testCollection/query/',
        payload: payload,
    }
}

onmessage = event => {
    processMessage(event, buildRequest)
}