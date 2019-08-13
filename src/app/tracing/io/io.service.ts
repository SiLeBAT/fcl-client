import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FclData } from '../data.model';
import { createInitialFclDataState } from '../state/tracing.reducers';
import { DataImporter } from './data-importer/data-importer';
import { DataExporter } from './data-exporter';

@Injectable({
    providedIn: 'root'
})
export class IOService {

    private rawData: any;

    private async preprocessData(data: any): Promise<FclData> {
        const fclData: FclData = createInitialFclDataState(); // DataService.createDefaultFclData();
        await DataImporter.preprocessData(data, fclData, this.httpClient);
        return fclData;
    }

    constructor(private httpClient: HttpClient) {}

    getData(dataSource: string | File): Promise<FclData> {
        if (typeof dataSource === 'string') {
            let rawData: any;
            return this.httpClient.get(dataSource)
              .toPromise()
              .then(response => {
                  rawData = response;
                  return this.preprocessData(response);
              })
              .then(data => {
                  this.rawData = rawData;
                  return data;
              });
        } else if (dataSource instanceof File) {
            const file: File = dataSource;
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();

                fileReader.onload = (event: Event) => {
                    const contents: any = event.target;

                    try {
                        const rawData = JSON.parse(contents.result);
                        this.preprocessData(rawData)
                        .then(data => {
                          this.rawData = rawData;
                          resolve(data);
                        })
                        .catch(e => {
                            reject(e);
                        });
                    } catch (e) {
                        reject(e);
                    }
                };

                fileReader.readAsText(file);
            });
        } else {
            throw new Error('no data source specified');
        }
    }

    getExportData(data: FclData): any {
        const exportData: any = this.rawData !== null ? this.rawData : {};
        DataExporter.exportData(data, exportData);
        return exportData;
    }
}
