export class ReportAPI {
    private static url = "/rest/api/v1/db/testCollection/query/";
    private headColumns: string[];

    constructor() {
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

    table(data: Array<JSON>, headColumns?: string[]): void {
        this.configure(headColumns);
        // @ts-ignore
        postMessage({
            data: data,
            headColumns: headColumns,
        });
    }

    configure(headColumns?: string[]) {
        if (headColumns != undefined) {
            for (let column of headColumns) {
                this.headColumns.push(column);
            }
        }
    }
}