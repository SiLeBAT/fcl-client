import { Action } from '@ngrx/store';
import { VisioReport } from '../visio/layout-engine/datatypes';

export enum TracingActionTypes {
  GenerateVisioLayoutSuccess = '[Tracing] Generate Visio Layout Success'
}

export class GenerateVisioLayoutSuccess implements Action {
    readonly type = TracingActionTypes.GenerateVisioLayoutSuccess;

    constructor(public payload: VisioReport) { }
}

export type TracingActions =
   GenerateVisioLayoutSuccess;
