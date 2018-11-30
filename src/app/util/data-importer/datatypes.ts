import {FclData} from './../datatypes';

export interface IDataImporter {
    isDataFormatSupported(data: any): Promise<boolean>;
    preprocessData(data: any, fclData: FclData): Promise<void>;
}
