import { Action } from '@ngrx/store';
import { NodeLayoutInfo } from './layout-engine/datatypes';

export enum VisioActionTypes {
    GenerateVisioReport = '[Visio] Generate Visio Report'
}

export class GenerateVisioReportMSA implements Action {
    readonly type = VisioActionTypes.GenerateVisioReport;

    constructor(public payload: { nodeLayoutInfo: Map<string, NodeLayoutInfo> }) {}
}

export type VisioActions =
      GenerateVisioReportMSA;
