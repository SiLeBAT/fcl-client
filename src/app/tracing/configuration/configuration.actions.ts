import { Action } from '@ngrx/store';
import { TableType } from './model';
import { TableColumn } from '../data.model';
import { HighlightingConditionToDelete } from './configuration.model';

export enum ConfigurationActionTypes {
    SelectFilterTableColumnsMSA = '[Tracing][Configuration] Choose Filter Table Columns',
    DeleteStationHighlightingRulesSOA = '[Tracing][Configuration][HighlightingStationList] Delete Highlighting Condition'
}
export class SelectFilterTableColumnsMSA implements Action {
    readonly type = ConfigurationActionTypes.SelectFilterTableColumnsMSA;

    constructor(public payload: { type: TableType, columns: TableColumn[], columnOrder: string[] }) {}
}
export class DeleteStationHighlightingRulesSOA implements Action {
    readonly type = ConfigurationActionTypes.DeleteStationHighlightingRulesSOA;

    constructor(public payload: { stationHighlightingCondition: HighlightingConditionToDelete }) {}
}

export type ConfigurationActions =
      SelectFilterTableColumnsMSA
    | DeleteStationHighlightingRulesSOA;
