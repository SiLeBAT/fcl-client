import { FclData } from "../../data.model";
import { IDataImporter } from "./datatypes";
import { DataImporterV0 } from "./data-importer-v0";
import { DataImporterV1 } from "./data-importer-v1";
import { HttpClient } from "@angular/common/http";
import { InputFormatError } from "../io-errors";

export class DataImporter {
    static async loadData(data: any, httpClient: HttpClient): Promise<FclData> {
        for (const importer of this.getDataImporter(httpClient)) {
            const formatIsValid: boolean =
                await importer.isDataFormatSupported(data);
            if (formatIsValid) {
                const fclData = await importer.importData(data);
                fclData.source.data = data;
                return fclData;
            }
        }
        throw new InputFormatError("Invalid data format.");
    }

    private static getDataImporter(httpClient: HttpClient): IDataImporter[] {
        return [new DataImporterV1(httpClient), new DataImporterV0()];
    }
}
