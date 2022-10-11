import { Action } from '@ngrx/store';
import { TableType } from './model';
import { TableColumn } from '../data.model';
import { HighlightingRuleDeleteRequestData } from './configuration.model';

export enum ConfigurationActionTypes {
    SelectFilterTableColumnsMSA = '[Tracing][Configuration] Choose Filter Table Columns',
    DeleteHighlightingRuleSSA = '[Tracing][Configuration][HighlightingList] Delete Highlighting Rule'
}
export class SelectFilterTableColumnsMSA implements Action {
    readonly type = ConfigurationActionTypes.SelectFilterTableColumnsMSA;

    constructor(public payload: { type: TableType; columns: TableColumn[]; columnOrder: string[] }) {}
}

export class DeleteHighlightingRuleSSA implements Action {
    readonly type = ConfigurationActionTypes.DeleteHighlightingRuleSSA;

    constructor(public payload: { deleteRequestData: HighlightingRuleDeleteRequestData }) {}
}

export type ConfigurationActions =
      SelectFilterTableColumnsMSA
    | DeleteHighlightingRuleSSA;
