import { Action } from '@ngrx/store';
import { TableType } from './model';
import { TableColumn } from '../data.model';
import { HighlightingRuleDeleteRequestData } from './configuration.model';

export enum ConfigurationActionTypes {
    SelectFilterTableColumnsMSA = '[Tracing][Configuration] Choose Filter Table Columns',
    DeleteStationHighlightingRulesSSA = '[Tracing][Configuration][HighlightingStationList] Delete Highlighting Condition'
}
export class SelectFilterTableColumnsMSA implements Action {
    readonly type = ConfigurationActionTypes.SelectFilterTableColumnsMSA;

    constructor(public payload: { type: TableType, columns: TableColumn[], columnOrder: string[] }) {}
}
export class DeleteStationHighlightingRulesSSA implements Action {
    readonly type = ConfigurationActionTypes.DeleteStationHighlightingRulesSSA;

    constructor(public payload: { stationHighlightingCondition: HighlightingRuleDeleteRequestData }) {}
}

export type ConfigurationActions =
      SelectFilterTableColumnsMSA
    | DeleteStationHighlightingRulesSSA;
