import * as Excel from "exceljs";
import { XlsxInputFormatError } from "../../io-errors";
import { IMPORT_ISSUES } from "./consts";
import { ColumnLabelTree } from "./xlsx-reader";

export class XlsxSheetReader {
    constructor(private workSheet: Excel.Worksheet) {}

    private validateHeaderCellMerging(
        colSpan: number,
        rowIndex: number,
        columnIndex: number,
        throwError: boolean,
    ): boolean {
        const topLeftCell = this.workSheet.getCell(rowIndex, columnIndex);
        if (
            // Either:
            // Cell isn't merged with colSpan-1 cells to the right of it
            // aka observed cell span is to small
            (colSpan > 1 &&
                !this.workSheet
                    .getCell(rowIndex, columnIndex + colSpan - 1)
                    .isMergedTo(topLeftCell.master)) ||
            // Cell is merged with colSpan cells to the right of it
            // aka observed colspan is to big
            this.workSheet
                .getCell(rowIndex, columnIndex + colSpan)
                .isMergedTo(topLeftCell.master)
        ) {
            if (throwError) {
                throw new XlsxInputFormatError(
                    IMPORT_ISSUES.unexpectedCellSpan(
                        rowIndex,
                        columnIndex,
                        this.workSheet.name,
                        colSpan,
                    ),
                );
            }
            return false;
        }
        return true;
    }

    private validateHeaderCellLabelMatch(
        columnHeader: ColumnLabelTree,
        throwError: boolean,
        rowIndex: number,
        columnIndex: number,
    ): boolean {
        const expectedCellLabel =
            typeof columnHeader === "string" ? columnHeader : columnHeader[0];
        const topLeftCell = this.workSheet.getCell(rowIndex, columnIndex);
        const observedCellLabel = topLeftCell.text.trim();
        // Validate Label match
        if (
            expectedCellLabel.toLocaleLowerCase() !==
            observedCellLabel.toLocaleLowerCase()
        ) {
            if (throwError) {
                throw new XlsxInputFormatError(
                    IMPORT_ISSUES.unexpectedCellText(
                        rowIndex,
                        columnIndex,
                        this.workSheet.name,
                        expectedCellLabel,
                    ),
                );
            }
            return false;
        }
        return true;
    }

    private validateHeaderCell(
        columnHeader: ColumnLabelTree,
        columnSpan: number,
        throwError: boolean,
        rowIndex: number,
        columnIndex: number,
    ) {
        return (
            this.validateHeaderCellLabelMatch(
                columnHeader,
                throwError,
                rowIndex,
                columnIndex,
            ) &&
            this.validateHeaderCellMerging(
                columnSpan,
                rowIndex,
                columnIndex,
                throwError,
            )
        );
    }

    validateTableHeader(
        columnHeaders: ColumnLabelTree[],
        throwError: boolean = false,
        offset: CellPosition = DEFAULT_TABLE_POSITION,
    ): boolean {
        let columnIndex = offset.col;
        for (const columnHeader of columnHeaders) {
            const columnSpan = typeof columnHeader === "string" ? 1 : getColumnHeadersSpan(columnHeader[1]).colSpan;
            if (
                !this.validateHeaderCell(
                    columnHeader,
                    columnSpan,
                    throwError,
                    offset.row,
                    columnIndex,
                )
            ) {
                return false;
            }

            if (typeof columnHeader !== "string") {
                const childHeaders = columnHeader[1];
                // columnSpan = getColumnHeadersSpan(childHeaders).colSpan;
                if (
                    !this.validateTableHeader(childHeaders, throwError, {
                        col: columnIndex,
                        row: offset.row + 1,
                    })
                ) {
                    return false;
                }
            }

            columnIndex += columnSpan;
        }
        return true;
    }

    readTable({
        offset = DEFAULT_TABLE_POSITION,
    }: ReadTableOptions = {}): Table {
        const tableHeader = readTableHeader(this.workSheet, offset);
        const { rows, columns } = readTableBody(this.workSheet, {
            offset: { col: offset.col, row: offset.row + tableHeader.rowCount },
            maxColumnIndex: offset.col + tableHeader.columnHeaders.length,
        });

        return {
            header: tableHeader,
            rows: rows,
            columns: columns,
            offset: offset,
        };
    }
}
