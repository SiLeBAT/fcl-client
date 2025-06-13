import { XlsxReader } from "./xlsx-reader";
import * as fs from "fs";

const READER_TEST_FILE_PATH = "src/assets/test-data/xlsx-reader-test.xlsx";

const SHEETS = {
    ROW_VALUE_TEST: "RowValueTest",
    COLUMN_TEST: "ColumnTest",
    TABLE_WITH_OFFSET_TEST: "TableWithOffset",
    ROW_VALUE_WITH_INVALID_FORMULA: "RowValueWithInvalidFormula",
    HEADER_WITH_INVALID_FORMULA: "HeaderWithInvalidFormula",
    CELL_WITH_INVALID_FORMULA: "CellWithInvalidFormula",
    INVALID_HEADER_NESTING: "InvalidHeaderNesting",
    MISSING_SUB_HEADERS: "MissingSubHeaders",
};

describe("xls-reader", () => {
    let xlsxReader: XlsxReader;

    beforeAll(async () => {
        if (!fs.existsSync(READER_TEST_FILE_PATH)) {
            throw new Error(
                `Reader-testfile-path '${READER_TEST_FILE_PATH}' does not exist.`,
            );
        }

        const data = fs.readFileSync(READER_TEST_FILE_PATH);
        const blob = new Blob([new Uint8Array(data.buffer)]);
        const file = new File([blob], "test.xlsx");

        xlsxReader = new XlsxReader();
        await xlsxReader.loadFile(file);
    });

    it("should read xlsx columns & header correctly", () => {
        const sheetReader = xlsxReader.getSheetReader(SHEETS.COLUMN_TEST);
        const table = sheetReader.readTable();
        expect(table).toMatchSnapshot();
    });

    it(`should detect invalid header nesting`, async () => {
        const sheetReader = xlsxReader.getSheetReader(
            SHEETS.INVALID_HEADER_NESTING,
        );
        expect(() => {
            sheetReader.readTable();
        }).toThrow(`A table header could not be parsed`);
    });

    it(`should detect missing sub header`, async () => {
        const sheetReader = xlsxReader.getSheetReader(
            SHEETS.INVALID_HEADER_NESTING,
        );
        expect(() => {
            sheetReader.readTable();
        }).toThrow(`A table header could not be parsed`);
    });

    it("should read row values correctly", () => {
        const sheetReader = xlsxReader.getSheetReader(SHEETS.ROW_VALUE_TEST);
        const table = sheetReader.readTable();
        const observedValues = table.rows.map((r) => r[1]);
        const observedTypesAndValues = observedValues.map((x) =>
            x === undefined ? undefined : `${(typeof x).substring(0, 1)}:${x}`,
        );
        const expectedTypesAndValues = table.rows.map((r) => r[2]);
        expect(observedTypesAndValues).toEqual(expectedTypesAndValues);
        expect(table).toMatchSnapshot();
    });

    it("should not read table with cell value error", () => {
        const sheetReader = xlsxReader.getSheetReader(
            SHEETS.CELL_WITH_INVALID_FORMULA,
        );
        expect(() => {
            sheetReader.readTable();
        }).toThrow(
            `Value in cell A1 on sheet 'CellWithInvalidFormula' cannot be used.`,
        );
    });

    it("should read table with offset correctly", () => {
        const sheetReader = xlsxReader.getSheetReader(
            SHEETS.TABLE_WITH_OFFSET_TEST,
        );
        const table = sheetReader.readTable({ offset: { col: 3, row: 4 } });
        expect(table).toMatchSnapshot();
    });
});
