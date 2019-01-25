import { StationInformation } from './datatypes';

export class CtNoAssigner {
    private static readonly minCharCode = 'A'.charCodeAt(0);
    private static readonly charCount = 'Z'.charCodeAt(0) - 'A'.charCodeAt(0) + 1;

    static assingCtNos(infoGrid: StationInformation[][]) {
        let code = -1;
        for (let r = 0, rowCount = infoGrid.length; r < rowCount; r++) {
            for (let c = 0, columnCount = infoGrid[r].length; c < columnCount; c++) {
                if (infoGrid[r][c] !== null) {
                    infoGrid[r][c].ctno = this.codeToNo(++code);
                }
            }
        }
    }

    private static codeToNo(code: number): string {
        if (code >= this.charCount) {
            const quotient = Math.floor(code / this.charCount);
            return this.codeToNo(quotient) + this.codeToNo(code - quotient);
        } else {
            return String.fromCharCode(this.minCharCode + code);
        }
    }
}
