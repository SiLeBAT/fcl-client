import { Action } from '@ngrx/store';
import { ActivationStatus } from '../../shared/model/types';

export enum GraphEditorActionTypes {
    GraphEditorActivated = '[Graph-Editor] Set activation state'
}

export class GraphEditorActivated implements Action {
    readonly type = GraphEditorActionTypes.GraphEditorActivated;

    constructor(public payload: ActivationStatus) {}
}

export type GraphEditorActions =
    GraphEditorActivated;
