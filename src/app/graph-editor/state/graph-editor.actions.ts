import { Action } from '@ngrx/store';

export enum GraphEditorActionTypes {
    Active = '[Graph-Editor] Graph-Editor Active'
}

export class Active implements Action {
    readonly type = GraphEditorActionTypes.Active;

    constructor(public payload: boolean) {}
}

export type GraphEditorActions =
      Active;
