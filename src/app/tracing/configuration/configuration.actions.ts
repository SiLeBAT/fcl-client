import { Action } from '@ngrx/store';
import { TableType } from './model';
import { TableColumn } from '../data.model';

export enum ConfigurationActionTypes {
    SelectFilterTableColumnsMSA = '[Tracing][Configuration] Choose Filter Table Columns'
}

export class SelectFilterTableColumnsMSA implements Action {
    readonly type = ConfigurationActionTypes.SelectFilterTableColumnsMSA;

    constructor(public payload: { type: TableType, columns: TableColumn[], columnOrder: string[] }) {}
}

export type ConfigurationActions =
      SelectFilterTableColumnsMSA
    ;
