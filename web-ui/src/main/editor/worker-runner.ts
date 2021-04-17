import {processMessage} from "./worker";
import {HttpQueryRequest, MongoProjection, MongoQuery} from "./reportAPI"

function buildRequest(query: MongoQuery, projection?: MongoProjection,
                      limit?: number, offset?: number, sort?: {}): HttpQueryRequest {
    let payload = {
        query: query.query,
        projection: projection,
        limit: limit,
        offset: offset,
        sort: sort,
    };
    return {
        url: '/rest/api/v1/db/testCollection/query/',
        payload: payload,
    }
}

onmessage = event => {
    processMessage(event, buildRequest)
}