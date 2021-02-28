export class Messages {
    private static block: HTMLElement = null;

    static add(message: string): void {
        let childBlock = document.createElement("div");
        childBlock.innerText = message;
        this.block.appendChild(childBlock);
    }

    static bindBlock(blockId: string): void {
        let block = document.getElementById(blockId);
        if (block != null) {
            this.block = block;
        }
    }
}