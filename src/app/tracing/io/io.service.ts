import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FclData, ShapeFileData } from '../data.model';
import { createInitialFclDataState } from '../state/tracing.reducers';
import { DataImporter } from './data-importer/data-importer';
import { DataExporter } from './data-exporter';
import { DataImporterV1 } from './data-importer/data-importer-v1';
import { createEmptyJson } from './json-data-creator';
import * as shapeFileImporter from './data-importer/shape-file-importer';
import { getJsonFromFile, getTextFromUtf8EncodedFile } from './io-utils';
import { InputFormatError } from './io-errors';

@Injectable({
    providedIn: 'root'
})
export class IOService {

    private async preprocessData(data: any): Promise<FclData> {
        const fclData: FclData = createInitialFclDataState();
        fclData.source = {};
        await DataImporter.preprocessData(data, fclData, this.httpClient);
        return fclData;
    }

    constructor(private httpClient: HttpClient) {}

    async getFclData(dataSource: string | File): Promise<FclData> {
        if (typeof dataSource === 'string') {
            return this.httpClient.get(dataSource)
                .toPromise()
                .then(response => {
                    return this.preprocessData(response);
                })
                .then(data => {
                    return data;
                })
                .catch(e => {
                    return Promise.reject(e);
                });

        } else if (dataSource instanceof File) {
            const file: File = dataSource;
            return new Promise((resolve, reject) => {
                getTextFromUtf8EncodedFile(file)
                .then(strData => {
                    const jsonData = this.try(
                        () => JSON.parse(strData),
                        (e) => reject(new InputFormatError(`Invalid json format.${e.message ? ' ' + e.message : ''}`))
                    );
                    this.preprocessData(jsonData)
                    .then(data => {
                        data.source.name = file.name;
                        resolve(data);
                    })
                    .catch(e => reject(e));
                })
                .catch(e => reject(e));
            });
        } else {
            throw new Error('no data source specified');
        }
    }

    private try<T>(tryFun: () => T, errFun: (e) => void): T {
        let result: T;
        try {
            result = tryFun();
        } catch (e) {
            if (!errFun) {
                throw e;
            } else {
                errFun(e);
            }
        }
        return result;
    }

    getShapeFileData(dataSource: string | File): Promise<ShapeFileData> {
        if (typeof dataSource === 'string') {
            let rawData: any;
            return this.httpClient.get(dataSource)
                .toPromise()
                .then(response => {
                    rawData = response;
                    return shapeFileImporter.validateShapeFileData(rawData);
                })
                .then(validationResult => {
                    if (validationResult.isValid) {
                        return rawData;
                    } else {
                        throw new Error(validationResult.messages.join(' '));
                    }
                });
        } else if (dataSource instanceof File) {
            let jsonData;
            return getJsonFromFile(dataSource)
                .then(response => {
                    jsonData = response;
                    return shapeFileImporter.validateShapeFileData(jsonData);
                })
                .then(validationResult => {
                    if (validationResult.isValid) {
                        return jsonData;
                    } else {
                        throw new Error(validationResult.messages.join(' '));
                    }
                });
        } else {
            throw new Error('no data source specified');
        }
    }

    getExportData(data: FclData): Promise<any> {
        if (data.source && data.source.data) {
            const dataImporter = new DataImporterV1(this.httpClient);
            return dataImporter.isDataFormatSupported(data.source.data).then(
                isSupported => {
                    const exportData: any = (
                        isSupported ?
                        JSON.parse(JSON.stringify(data.source.data)) :
                        createEmptyJson()
                    );
                    DataExporter.exportData(data, exportData);
                    return exportData;
                }
            );
        } else {
            return new Promise(resolve => {
                const exportData = createEmptyJson() ;
                DataExporter.exportData(data, exportData);
                resolve(exportData);
            });
        }
    }
}
