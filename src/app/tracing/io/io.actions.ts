import { Action } from "@ngrx/store";
import { IssueState } from "./data-importer/xlsx-import/xlsx-import";

export enum IOActionTypes {
    LoadFclDataMSA = "[Tracing][IO] Load Fcl Data",
    ImportWithIssuesMSA = "[Tracing][IO] imported Data with Issues",
    LoadShapeFileMSA = "[Tracing][IO] Load Shape File",
    SaveFclDataMSA = "[Tracing][IO] Save Fcl Data",
    SaveGraphImageMSA = "[Tracing][IO] Save Graph Image",
}

export class LoadFclDataMSA implements Action {
    readonly type = IOActionTypes.LoadFclDataMSA;

    constructor(public payload: { dataSource: string | FileList }) {}
}

export class ImportWithIssuesMSA implements Action {
    readonly type = IOActionTypes.ImportWithIssuesMSA;
    constructor(public payload: { issues: IssueState }) {}
}

export class LoadShapeFileMSA implements Action {
    readonly type = IOActionTypes.LoadShapeFileMSA;

    constructor(public payload: { dataSource: FileList }) {}
}

export class SaveFclDataMSA implements Action {
    readonly type = IOActionTypes.SaveFclDataMSA;

    constructor(
        public payload: {
            fileName?: string;
            disableAnonymizationNote?: boolean;
        },
    ) {}
}

export class SaveGraphImageMSA implements Action {
    readonly type = IOActionTypes.SaveGraphImageMSA;

    constructor(public payload: { canvas: any }) {}
}

export type IOActions =
    | LoadFclDataMSA
    | SaveFclDataMSA
    | SaveGraphImageMSA
    | ImportWithIssuesMSA;
