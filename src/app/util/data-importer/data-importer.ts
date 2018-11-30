import {FclData} from './../datatypes';
import {IDataImporter} from './datatypes';
import {DataImporterV0} from './data-importer-v0';
import {DataImporterV1} from './data-importer-v1';
import {Http} from '@angular/http';

export class DataImporter {
    //private static readonly dataImporter: IDataImporter[] = [new DataImporterV1(), new DataImporterV0()];

    static async preprocessData(data: any, fclData: FclData, http: Http): Promise<void> {
        console.log('DataImporter.preprocessData entered');
        for (const importer of this.getDataImporter(http)) { // }   DataImporter.dataImporter) {
            const formatIsValid: boolean = await importer.isDataFormatSupported(data);
            if (formatIsValid) {
                await importer.preprocessData(data, fclData);
                return;
            }
        }
        throw new SyntaxError('Invalid data format');
    }

    private static getDataImporter(http: Http): IDataImporter[] {
        return [new DataImporterV1(http), new DataImporterV0()];
    }
}
