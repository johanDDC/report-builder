export interface TableConfig {
    columns?: Array<string>,
    rowsToView?: number,
}

export const EMPTY_CONFIG : TableConfig = {
    columns: [],
    rowsToView: 0,
}

export class ReportAPI {
    private static url = "/rest/api/v1/db/testCollection/query/";
    private config: TableConfig;

    constructor() {
        console.log("costructed");
        this.config = EMPTY_CONFIG;
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
            return {};  // TODO errors
        }
    }

    table(data: Array<JSON>): void {
        console.log("api.table", data);
        // @ts-ignore
        postMessage({
            data: data,
            config: this.config,
        });
    }

    configure(config: TableConfig) {
        if (config["columns"] != undefined) {
            this.config["columns"] = config["columns"];
        }
        if (config["rowsToView"] != undefined) {
            this.config["rowsToView"] = config["rowsToView"];
        }
    }
}