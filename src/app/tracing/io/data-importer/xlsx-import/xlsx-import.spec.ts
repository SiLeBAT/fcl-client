import { importXlsxFile } from "./xlsx-import";
import * as fs from "fs";

const XLSX_TEMPLATE_PATH = "src/assets/test-data/xlsx-aio-import-test.xlsx";

describe("xls-import", () => {
    it("should read xlsx columns & header correctly", async () => {
        if (!fs.existsSync(XLSX_TEMPLATE_PATH)) {
            throw new Error(
                `Xlsx template-file-path '${XLSX_TEMPLATE_PATH}' does not exist.`,
            );
        }

        const data = fs.readFileSync(XLSX_TEMPLATE_PATH);
        const blob = new Blob([new Uint8Array(data.buffer)]);
        const file = new File([blob], "test.xlsx");

        const { data: extJsonData, warnings: warnings } =
            await importXlsxFile(file);
        expect(extJsonData).toMatchSnapshot();
        expect(warnings).toMatchSnapshot();
    });
});
