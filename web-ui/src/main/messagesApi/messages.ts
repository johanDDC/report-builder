import {MutableRefObject} from "react";

export class Messages {
    private static blockRef: MutableRefObject<HTMLElement> = null;

    static add(message: string): void {
        let childBlock = document.createElement("div");
        childBlock.innerText = message;
        this.blockRef.current.appendChild(childBlock);
    }

    static bindBlock(blockRef: MutableRefObject<HTMLElement>): void {
        // console.log(blockRef, blockRef.current);
        this.blockRef = blockRef;
    }
}