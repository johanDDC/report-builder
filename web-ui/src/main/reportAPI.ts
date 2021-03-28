export class ReportAPI {

    constructor() {
        console.log("costructed");
    }

    query(query: {}): {} {
        XMLHttpRequest
        console.log("api.query", query);
        return {};
    }

    table(data: Array<JSON>): void {
        console.log("api.table", data);
        // @ts-ignore
        postMessage(data);
    }
}