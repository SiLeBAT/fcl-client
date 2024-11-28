import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { FclData, ShapeFileData, JsonDataExtract } from "../data.model";
import { createInitialFclDataState } from "../state/tracing.reducers";
import { DataImporter } from "./data-importer/data-importer";
import { DataExporter } from "./data-exporter";
import { DataImporterV1 } from "./data-importer/data-importer-v1";
import * as shapeFileImporter from "./data-importer/shape-file-importer";
import { getJsonFromFile, isJsonFileType } from "./io-utils";
import { JsonData } from "./ext-data-model.v1";
import * as _ from "lodash";
import { importXlsxFile } from "./data-importer/xlsx-import/xlsx-import";
import {
    hasUtxCore,
    UtxImporter,
} from "./data-importer/utx-import/utx-importer";
import { RelaxedUtxImporter } from "./data-importer/utx-import/relaxed-utx-importer";

@Injectable({
    providedIn: "root",
})
export class IOService {
    private async preprocessData(data: any): Promise<FclData> {
        const fclData: FclData = createInitialFclDataState();
        if (hasUtxCore(data)) {
            await new RelaxedUtxImporter(this.httpClient).preprocessData(
                data,
                fclData,
            );
        } else {
            await DataImporter.preprocessData(data, fclData, this.httpClient);
        }
        return fclData;
    }

    constructor(private httpClient: HttpClient) {}

    private async getFclDataFromFile(file: File): Promise<FclData> {
        let fclData: FclData;
        if (isJsonFileType(file)) {
            const jsonData = await getJsonFromFile(file);
            fclData = await this.preprocessData(jsonData);
        } else {
            const { data: jsonData, warnings } = await importXlsxFile(file);
            fclData = await this.preprocessData(jsonData);
            fclData.importWarnings = [...warnings, ...fclData.importWarnings];
        }
        fclData.source.name = file.name;
        return fclData;
    }

    async getFclData(dataSource: string | File): Promise<FclData> {
        if (typeof dataSource === "string") {
            return this.httpClient
                .get(dataSource)
                .toPromise()
                .then(async (response) => this.preprocessData(response))
                .then((fclData) => {
                    fclData.source.name = this.getFileName(dataSource);
                    return fclData;
                })
                .catch(async (e) => Promise.reject(e));
        } else if (dataSource instanceof File) {
            const file: File = dataSource;
            return new Promise((resolve, reject) => {
                this.getFclDataFromFile(file)
                    .then((fclData) => resolve(fclData))
                    .catch((e) => reject(e));
            });
        } else {
            throw new Error("No data source specified.");
        }
    }

    private getFileName(filePath: string): string {
        return filePath.split("/").pop()!.split("\\").pop()!;
    }

    async getShapeFileData(dataSource: File): Promise<ShapeFileData> {
        if (dataSource instanceof File) {
            return shapeFileImporter.getShapeFileData(dataSource);
        } else {
            throw new Error("No data source specified.");
        }
    }

    async getExportData(fclData: FclData): Promise<any> {
        const oldExtData = fclData.source.data;
        if (oldExtData) {
            const dataImporter = new DataImporterV1(this.httpClient);

            return dataImporter
                .isDataFormatSupported(oldExtData)
                .then((isSupported) => {
                    const exportData = DataExporter.exportData(
                        fclData,
                        isSupported ? oldExtData : undefined,
                    );
                    return exportData;
                });
        } else {
            return new Promise((resolve) => {
                const exportData = DataExporter.exportData(fclData);
                resolve(exportData);
            });
        }
    }

    async hasDataChanged(
        currentData: FclData,
        lastUnchangedJsonDataExtract: JsonDataExtract,
    ): Promise<boolean> {
        return this.getExportData(currentData)
            .then(async (currentExtData: JsonData) =>
                this.getJsonDataExtract(currentExtData),
            )
            .then((currentJsonDataExtract: JsonDataExtract) => {
                const dataHasChanged = !_.isEqual(
                    _.omit(lastUnchangedJsonDataExtract, [
                        "settings.view.graph.transformation",
                        "settings.view.gis.transformation",
                        "settings.view.showGis",
                    ]),
                    _.omit(currentJsonDataExtract, [
                        "settings.view.graph.transformation",
                        "settings.view.gis.transformation",
                        "settings.view.showGis",
                    ]),
                );

                return dataHasChanged;
            });
    }

    async fclDataToJsonDataExtract(data: FclData): Promise<JsonDataExtract> {
        return this.getExportData(data).then(async (extData: JsonData) =>
            this.getJsonDataExtract(extData),
        );
    }

    async getJsonDataExtract(extData: JsonData): Promise<JsonDataExtract> {
        const extract = {
            settings: _.cloneDeep(extData.settings),
            tracing: _.cloneDeep(extData.tracing),
        };

        return extract;
    }
}
