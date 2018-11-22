import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {DeliveryData, FclData, FclElements, GraphSettings, ObservedType, StationData, TableSettings} from './datatypes';


import {Utils} from './utils';
import {Constants} from './constants';
import {DataImporter} from './data-importer/data-importer';
import {DataExporter } from './data-exporter';

@Injectable()
export class DataService {

    private dataSource: string | File;
    private data: FclData;
    private rawData: any;

    static getDefaultGraphSettings(): GraphSettings {
        return {
            type: Constants.DEFAULT_GRAPH_TYPE,
            nodeSize: Constants.DEFAULT_GRAPH_NODE_SIZE,
            fontSize: Constants.DEFAULT_GRAPH_FONT_SIZE,
            mergeDeliveries: Constants.DEFAULT_GRAPH_MERGE_DELIVERIES,
            skipUnconnectedStations: Constants.DEFAULT_SKIP_UNCONNECTED_STATIONS,
            showLegend: Constants.DEFAULT_GRAPH_SHOW_LEGEND,
            showZoom: Constants.DEFAULT_GRAPH_SHOW_ZOOM
        };
    }

    static getDefaultTableSettings(): TableSettings {
        return {
            mode: Constants.DEFAULT_TABLE_MODE,
            width: Constants.DEFAULT_TABLE_WIDTH,
            stationColumns: Constants.DEFAULT_TABLE_STATION_COLUMNS.toArray(),
            deliveryColumns: Constants.DEFAULT_TABLE_DELIVERY_COLUMNS.toArray(),
            showType: Constants.DEFAULT_TABLE_SHOW_TYPE
        };
    }

    private static createDefaultFclData(): FclData {
        return {
            elements: {
                stations: null,
                deliveries: null
            },
            layout: null,
            gisLayout: null,
            graphSettings: this.getDefaultGraphSettings(),
            tableSettings: this.getDefaultTableSettings()
        };
    }

    private async preprocessData(data: any): Promise<FclData> {
        const fclData: FclData = DataService.createDefaultFclData();
        await DataImporter.preprocessData(data, fclData, this.http);
        return fclData;
    }

    constructor(private http: Http) {
    }

    setDataSource(source: string | File) {
        delete this.data;
        delete this.rawData;
        this.dataSource = source;
    }

    getData(): Promise<FclData> {
        if (this.data != null) {
            // return this.data;
            return new Promise((resolve, reject) => resolve(this.data));
        } else if (typeof this.dataSource === 'string') {
            console.log('DataService.getData cP1 dataSource is string');

            /*const json = (await this.http.get(this.dataSource).toPromise()).json();
            this.data = await this.preprocessData(json);
            return this.data; */
            let rawData: any;
            return this.http.get(this.dataSource).toPromise().then(response => {
                rawData = response.json();
                // this.rawData = response.json();
                return this.preprocessData(rawData);
            }).then(data => {
                this.rawData = rawData;
                this.data = data;
                return this.data;
            });

        } else if (this.dataSource instanceof File) {
            console.log('DataService.getData cP2 dataSource is file');
            const file: File = this.dataSource;
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();

                fileReader.onload = (event: Event) => {
                    const contents: any = event.target;

                    try {
                        const rawData = JSON.parse(contents.result);
                        this.preprocessData(rawData).then(data => {
                            this.rawData = rawData;
                            this.data = data;
                            resolve(this.data);
                        }).catch( e => {
                            reject(e);
                        });
                        // resolve(this.data);
                    } catch (e) {
                        reject(e);
                    }
                };

                fileReader.readAsText(file);
            });
            /*const file: File = this.dataSource;
            const fileReader = new FileReader();

            fileReader.onload = async (event: Event) => {
                const contents: any = event.target;
                this.data = await this.preprocessData(JSON.parse(contents.result));
            };

            await fileReader.readAsText(file);
            return this.data;*/

            /*const file: File = this.dataSource;
            const fileReader = new FileReader();

            fileReader.onload = (event: Event) => {
                const contents: any = event.target;

                // try {
                this.preprocessData(JSON.parse(contents.result)).then(data => {
                    this.data = data;
                    return data;
                });
                //   resolve(this.data);
                //} catch (e) {
                //  reject(e);
                // }
            };

            fileReader.readAsText(file);
            //  });*/
        } else {
            throw new Error('no data source specified');
            // return new Promise((resolve, reject) => reject('no data source specified'));
        }
    }

    getExportData(): any {
        const exportData: any = (this.rawData !== null ? this.rawData : {});
        DataExporter.exportData(this.data, exportData);
        return exportData;
    }
    /*getData(): Promise<FclData> {
        if (this.data != null) {
            return new Promise((resolve, reject) => resolve(this.data));
        } else if (typeof this.dataSource === 'string') {
            return this.http.get(this.dataSource)
            .toPromise()
            .then(response => {
                this.data = this.preprocessData(response.json());

                return this.data;
            }).catch(error => Promise.reject(error));
        } else if (this.dataSource instanceof File) {
            const file: File = this.dataSource;
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();

                fileReader.onload = (event: Event) => {
                    const contents: any = event.target;

                    try {
                        this.data = this.preprocessData(JSON.parse(contents.result));
                        resolve(this.data);
                    } catch (e) {
                        reject(e);
                    }
                };

                fileReader.readAsText(file);
            });
        } else {
            return new Promise((resolve, reject) => reject('no data source specified'));
        }
    }*/
}
