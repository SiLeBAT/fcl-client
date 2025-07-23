import * as fs from "fs";
import { XlsxReader } from "../xlsx-reader";

import { AllInOneImporter } from "./importer";

const AIO_TEMPLATE_PATH = "src/assets/test-data/xlsx-aio-import-test.xlsx";

describe("xlsx-aio-import", () => {
    it("should import xlsx aio template correctly as xlsx ImportResult", async () => {
        if (!fs.existsSync(AIO_TEMPLATE_PATH)) {
            throw new Error(
                `Test-template-path '${AIO_TEMPLATE_PATH}' does not exist.`,
            );
        }

        const data = fs.readFileSync(AIO_TEMPLATE_PATH);
        const blob = new Blob([new Uint8Array(data.buffer)]);
        const file = new File([blob], "test.xlsx");

        const xlsReader = new XlsxReader();
        await xlsReader.loadFile(file);
        const aioImporter = new AllInOneImporter();
        const importResult = await aioImporter.importTemplate(xlsReader);

        expect(importResult).toMatchSnapshot();
    });
});
