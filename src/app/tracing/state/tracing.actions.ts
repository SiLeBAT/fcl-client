import { Action } from '@ngrx/store';
import { VisioReport } from '../visio/layout-engine/datatypes';

export enum TracingActionTypes {
    GenerateVisioLayoutSuccess = '[Tracing] Generate Visio Layout Success',
    ToggleLeftSideBar = '[Tracing] Toggle Left SideBar',
    ToggleRightSideBar = '[Tracing] Toggle Right SideBar'
}

export class GenerateVisioLayoutSuccess implements Action {
    readonly type = TracingActionTypes.GenerateVisioLayoutSuccess;

    constructor(public payload: VisioReport) { }
}

export class ToggleLeftSideBar implements Action {
    readonly type = TracingActionTypes.ToggleLeftSideBar;

    constructor(public payload: boolean) { }
}

export class ToggleRightSideBar implements Action {
    readonly type = TracingActionTypes.ToggleRightSideBar;

    constructor(public payload: boolean) { }
}

export type TracingActions =
      GenerateVisioLayoutSuccess
    | ToggleLeftSideBar
    | ToggleRightSideBar;
