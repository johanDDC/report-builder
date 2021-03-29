export class ReportAPI {

    private static url = "../rest/api/v1/db/testCollection/query/";

    constructor() {
        console.log("costructed");
    }

    query(query: {}) {
        let request = new XMLHttpRequest();
        request.open("POST", ReportAPI.url, false);
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify({"query": query}));
        if (request.readyState == 4 && request.status == 200) {
            console.log("api.query", query, request.responseText);
            return JSON.parse(request.responseText);
        } else {
            return {};
        }
    }

    table(data: Array<JSON>): void {
        console.log("api.table", data);
        // @ts-ignore
        postMessage(data);
    }
}