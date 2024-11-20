import { Utils } from "../../util/non-ui-utils";

export class CellGapCloser {
    static closeGaps(matrix: number[][]): number[][] {
        if (matrix.length === 0 || matrix[0].length === 0) {
            return matrix;
        }
        return this.fillUGaps(matrix);
    }

    private static fillUGaps(matrix: number[][]): number[][] {
        this.fillBottomUpUGaps(matrix);
        matrix = Utils.getTranspose(matrix);
        this.fillBottomUpUGaps(matrix);
        matrix.reverse();
        this.fillBottomUpUGaps(matrix);
        matrix = Utils.getTranspose(matrix);
        matrix.reverse();
        this.fillBottomUpUGaps(matrix);
        matrix.reverse();
        matrix.forEach((row) => row.reverse());
        return matrix;
    }

    private static fillBottomUpUGaps(matrix: number[][]) {
        const rowCount = matrix.length;
        const columnCount = matrix[0].length;
        const lastVGroupIndices = matrix[0].slice();
        for (let r = 1; r < rowCount; r++) {
            let lastColIndex = 0;
            let lastHGroupIndex = matrix[r][0];
            for (let c = 1; c < columnCount; c++) {
                if (matrix[r][c] < 0) {
                    if (lastHGroupIndex >= 0) {
                        if (lastVGroupIndices[c] >= 0) {
                            if (lastHGroupIndex !== lastVGroupIndices[c]) {
                                lastHGroupIndex = -1;
                            } else {
                                // ok
                            }
                        } else {
                            lastHGroupIndex = -1;
                        }
                    }
                } else {
                    if (lastHGroupIndex === matrix[r][c]) {
                        for (let i = lastColIndex + 1; i < c; i++) {
                            matrix[r][i] = lastHGroupIndex;
                        }
                    }
                    lastColIndex = c;
                    lastHGroupIndex = matrix[r][c];
                }
            }
        }
    }
}
