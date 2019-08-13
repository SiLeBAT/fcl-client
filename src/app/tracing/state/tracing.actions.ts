import { Action } from '@ngrx/store';
import { VisioReport } from '../visio/layout-engine/datatypes';
import {
    GraphType, Size, TableMode, FclData, ShowType, SelectedElements, Position,
    SetTracingSettingsPayload, SetHighlightingSettingsPayload, Layout
} from '../data.model';
import { SetStationGroupsPayload } from './../grouping/model';
import { ActivationStatus } from '../../shared/model/types';

export enum TracingActionTypes {
    TracingActivated = '[Tracing] Tracing active',
    LoadFclDataSuccess = '[Tracing] Load Fcl Data Success',
    LoadFclDataFailure = '[Tracing] Load Fcl Data Failure',
    GenerateVisioLayoutSuccess = '[Tracing] Generate Visio Layout Success',
    ShowGraphSettingsSOA = '[Tracing] Show Graph Settings',
    ShowDataTableSOA = '[Tracing] Show Data Table',
    ShowTableSettingsSOA = '[Tracing] Show Table Settings',
    SetGraphTypeSOA = '[Tracing] Set Graph Type',
    SetSchemaGraphLayoutSOA = '[Tracing] Set Schema Graph Layout',
    SetGisGraphLayoutSOA = '[Tracing] Set Gis Graph Layout',
    SetNodeSizeSOA = '[Tracing] Set Node Size',
    SetFontSizeSOA = '[Tracing] Set Font Size',
    MergeDeliveriesSOA = '[Tracing] Merge Deliveries',
    ShowLegendSOA = '[Tracing] Show Legend',
    ShowZoomSOA = '[Tracing] Show Zoom',
    SetTableModeSOA = '[Tracing] Set Table Mode',
    SetTableColumnsSOA = '[Tracing] Set Table Columns',
    SetTableShowTypeSOA = '[Tracing] Set Table Show Type',
    SetSelectedElementsSOA = '[Tracing] Set Element Selection',
    SetStationPositionsSOA = '[Tracing] Set Station Positions',
    SetStationPositionsAndLayoutSOA = '[Tracing] Set Station Positions And Layout',
    SetStationGroupsSOA = '[Tracing] Set Station Groups',
    SetTracingSettingsSOA = '[Tracing] Set Tracing Settings',
    SetHighlightingSettingsSOA = '[Tracing] Set Highlighting Settings'
}

export class TracingActivated implements Action {
    readonly type = TracingActionTypes.TracingActivated;

    constructor(public payload: ActivationStatus) {}
}

export class LoadFclDataSuccess implements Action {
    readonly type = TracingActionTypes.LoadFclDataSuccess;

    constructor(public payload: { fclData: FclData }) {}
}

export class LoadFclDataFailure implements Action {
    readonly type = TracingActionTypes.LoadFclDataFailure;
}

export class GenerateVisioLayoutSuccess implements Action {
    readonly type = TracingActionTypes.GenerateVisioLayoutSuccess;

    constructor(public payload: VisioReport) {}
}

export class ShowGraphSettingsSOA implements Action {
    readonly type = TracingActionTypes.ShowGraphSettingsSOA;

    constructor(public payload: { showGraphSettings: boolean }) {}
}

export class ShowDataTableSOA implements Action {
    readonly type = TracingActionTypes.ShowDataTableSOA;

    constructor(public payload: { showDataTable: boolean }) {}
}

export class ShowTableSettingsSOA implements Action {
    readonly type = TracingActionTypes.ShowTableSettingsSOA;

    constructor(public payload: { showTableSettings: boolean }) {}
}

export class SetGraphTypeSOA implements Action {
    readonly type = TracingActionTypes.SetGraphTypeSOA;

    constructor(public payload: GraphType) {}
}

export class SetNodeSizeSOA implements Action {
    readonly type = TracingActionTypes.SetNodeSizeSOA;

    constructor(public payload: Size) {}
}

export class SetFontSizeSOA implements Action {
    readonly type = TracingActionTypes.SetFontSizeSOA;

    constructor(public payload: Size) {}
}

export class MergeDeliveriesSOA implements Action {
    readonly type = TracingActionTypes.MergeDeliveriesSOA;

    constructor(public payload: boolean) {}
}

export class ShowLegendSOA implements Action {
    readonly type = TracingActionTypes.ShowLegendSOA;

    constructor(public payload: boolean) {}
}

export class ShowZoomSOA implements Action {
    readonly type = TracingActionTypes.ShowZoomSOA;

    constructor(public payload: boolean) {}
}

export class SetTableModeSOA implements Action {
    readonly type = TracingActionTypes.SetTableModeSOA;

    constructor(public payload: TableMode) {}
}

export class SetTableColumnsSOA implements Action {
    readonly type = TracingActionTypes.SetTableColumnsSOA;

    constructor(public payload: [TableMode, string[]]) {}
}

export class SetTableShowTypeSOA implements Action {
    readonly type = TracingActionTypes.SetTableShowTypeSOA;

    constructor(public payload: ShowType) {}
}

export class SetSelectedElementsSOA implements Action {
    readonly type = TracingActionTypes.SetSelectedElementsSOA;

    constructor(public payload: { selectedElements: SelectedElements}) {}
}

export class SetStationPositionsSOA implements Action {
    readonly type = TracingActionTypes.SetStationPositionsSOA;

    constructor(public payload: { stationPositions: { [key: string]: Position }}) {}
}

export class SetStationPositionsAndLayoutSOA implements Action {
    readonly type = TracingActionTypes.SetStationPositionsAndLayoutSOA;

    constructor(public payload: { stationPositions: { [key: string]: Position }, layout: Layout }) {}
}

export class SetSchemaGraphLayoutSOA implements Action {
    readonly type = TracingActionTypes.SetSchemaGraphLayoutSOA;

    constructor(public payload: { layout: { zoom: number, pan: Position } }) {}
}

export class SetGisGraphLayoutSOA implements Action {
    readonly type = TracingActionTypes.SetGisGraphLayoutSOA;

    constructor(public payload: { layout: { zoom: number, pan: Position } }) {}
}

export class SetStationGroupsSOA implements Action {
    readonly type = TracingActionTypes.SetStationGroupsSOA;

    constructor(public payload: SetStationGroupsPayload) {}
}

export class SetTracingSettingsSOA implements Action {
    readonly type = TracingActionTypes.SetTracingSettingsSOA;

    constructor(public payload: SetTracingSettingsPayload) {}
}

export class SetHighlightingSettingsSOA implements Action {
    readonly type = TracingActionTypes.SetHighlightingSettingsSOA;

    constructor(public payload: SetHighlightingSettingsPayload) {}
}

export type TracingActions =
      TracingActivated
    | LoadFclDataSuccess
    | LoadFclDataFailure
    | GenerateVisioLayoutSuccess
    | ShowGraphSettingsSOA
    | ShowDataTableSOA
    | ShowTableSettingsSOA
    | SetSchemaGraphLayoutSOA
    | SetGisGraphLayoutSOA
    | SetGraphTypeSOA
    | SetNodeSizeSOA
    | SetFontSizeSOA
    | MergeDeliveriesSOA
    | ShowLegendSOA
    | ShowZoomSOA
    | SetTableModeSOA
    | SetTableColumnsSOA
    | SetTableShowTypeSOA
    | SetSelectedElementsSOA
    | SetStationPositionsSOA
    | SetStationPositionsAndLayoutSOA
    | SetStationGroupsSOA
    | SetTracingSettingsSOA
    | SetHighlightingSettingsSOA;
