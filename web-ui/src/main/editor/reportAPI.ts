export interface TableConfig {
    columns?: Array<string>,
    rowsToView?: number,
}

export class ReportAPI {
    private static url = "/rest/api/v1/db/testCollection/query/";
    private config: TableConfig;

    constructor() {
        this.config = {
            columns: [],
            rowsToView: 5,
        };
    }

    query(query: {}) {
        let request = new XMLHttpRequest();
        request.open("POST", ReportAPI.url, false);
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify({"query": query}));
        if (request.readyState == 4 && request.status == 200) {
            return JSON.parse(request.responseText);
        } else {
            return {};  // TODO errors
        }
    }

    table(data: Array<JSON>, config?: TableConfig): void {
        this.configure(config);
        // @ts-ignore
        postMessage({
            data: data,
            config: this.config,
        });
    }

    configure(config: TableConfig) {
        if (config != undefined) {
            for (let field of Object.keys(config)) {
                this.config[field] = config[field];
            }
        }
    }
}