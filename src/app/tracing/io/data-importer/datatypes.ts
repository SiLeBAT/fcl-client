import { FclData } from "../../data.model";

export interface IDataImporter {
    isDataFormatSupported(data: any): Promise<boolean>;
    importData(data: any): Promise<FclData>;
}
