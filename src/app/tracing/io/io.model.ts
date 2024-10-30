import { FclData } from "../data.model";

export interface ModelImportResult {
    fclData: FclData;
    warnings?: string[];
}
