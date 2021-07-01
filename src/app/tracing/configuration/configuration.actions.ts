import { Action } from '@ngrx/store';
import { TableType } from './model';
import { TableColumn } from '../data.model';
import { HighlightingRuleDeleteRequestData } from './configuration.model';

export enum ConfigurationActionTypes {
    SelectFilterTableColumnsMSA = '[Tracing][Configuration] Choose Filter Table Columns',
    DeleteStationHighlightingRuleSSA = '[Tracing][Configuration][HighlightingStationList] Delete Station Highlighting Condition'
}
export class SelectFilterTableColumnsMSA implements Action {
    readonly type = ConfigurationActionTypes.SelectFilterTableColumnsMSA;

    constructor(public payload: { type: TableType, columns: TableColumn[], columnOrder: string[] }) {}
}
export class DeleteStationHighlightingRuleSSA implements Action {
    readonly type = ConfigurationActionTypes.DeleteStationHighlightingRuleSSA;

    constructor(public payload: { deleteRequestData: HighlightingRuleDeleteRequestData }) {}
}

export type ConfigurationActions =
      SelectFilterTableColumnsMSA
    | DeleteStationHighlightingRuleSSA;
