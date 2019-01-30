import { Action } from '@ngrx/store';
import { VisioReport } from '../visio/layout-engine/datatypes';
import { FclElements } from '../util/datatypes';

export enum TracingActionTypes {
  GenerateVisioLayout = '[Tracing] Generate Visio Layout',
  GenerateVisioLayoutSuccess = '[Tracing] Generate Visio Layout Success'
}

export class GenerateVisioLayout implements Action {
    readonly type = TracingActionTypes.GenerateVisioLayout;

    constructor(public payload: FclElements) { }
}

export class GenerateVisioLayoutSuccess implements Action {
    readonly type = TracingActionTypes.GenerateVisioLayoutSuccess;

    constructor(public payload: VisioReport) { }
}

export type TracingActions =
    GenerateVisioLayout
  | GenerateVisioLayoutSuccess;
