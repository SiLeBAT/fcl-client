import { Action } from '@ngrx/store';
import { ClearInvisibilitiesOptions, SelectedElements, ShowElementsTraceParams } from './data.model';

export enum TracingActionTypes {
    ClearTraceMSA = '[Tracing] Clear Trace',
    ClearOutbreakStationsMSA = '[Tracing] Clear Outbreak Stations',
    ClearInvisibilitiesMSA = '[Tracing] Clear Invisibilities',
    ShowStationPropertiesMSA = '[Tracing] Show Station Properties',
    MarkStationsAsOutbreakMSA = '[Tracing] Mark Stations as Outbreak',
    SetStationCrossContaminationMSA = '[Tracing] Set Station Cross Contamination',
    SetStationKillContaminationMSA = '[Tracing] Set Station Kill Contamination',
    MakeElementsInvisibleMSA = '[Tracing] Make Elements Invisible',
    ShowDeliveryPropertiesMSA = '[Tracing] Show Delivery Properties',
    ShowElementsTraceMSA = '[Tracing] Show Elements Trace'
}

export class ClearTraceMSA implements Action {
    readonly type = TracingActionTypes.ClearTraceMSA;

    constructor(public payload: {}) {}
}

export class ClearOutbreakStationsMSA implements Action {
    readonly type = TracingActionTypes.ClearOutbreakStationsMSA;

    constructor(public payload: {}) {}
}

export class ClearInvisibilitiesMSA implements Action {
    readonly type = TracingActionTypes.ClearInvisibilitiesMSA;

    constructor(public payload: ClearInvisibilitiesOptions) {}
}

export class ShowStationPropertiesMSA implements Action {
    readonly type = TracingActionTypes.ShowStationPropertiesMSA;

    constructor(public payload: { stationId: string }) {}
}

export class ShowDeliveryPropertiesMSA implements Action {
    readonly type = TracingActionTypes.ShowDeliveryPropertiesMSA;

    constructor(public payload: { deliveryIds: string[] }) {}
}

export class MarkStationsAsOutbreakMSA implements Action {
    readonly type = TracingActionTypes.MarkStationsAsOutbreakMSA;

    constructor(public payload: { stationIds: string[], outbreak: boolean }) {}
}

export class SetStationCrossContaminationMSA implements Action {
    readonly type = TracingActionTypes.SetStationCrossContaminationMSA;

    constructor(public payload: { stationIds: string[], crossContamination: boolean }) {}
}

export class SetStationKillContaminationMSA implements Action {
    readonly type = TracingActionTypes.SetStationKillContaminationMSA;

    constructor(public payload: { stationIds: string[], killContamination: boolean }) {}
}

export class MakeElementsInvisibleMSA implements Action {
    readonly type = TracingActionTypes.MakeElementsInvisibleMSA;

    constructor(public payload: SelectedElements) {}
}

export class ShowElementsTraceMSA implements Action {
    readonly type = TracingActionTypes.ShowElementsTraceMSA;

    constructor(public payload: ShowElementsTraceParams) {}
}

export type TracingActions =
      ClearTraceMSA
    | ClearOutbreakStationsMSA
    | ClearInvisibilitiesMSA
    | ShowStationPropertiesMSA
    | MarkStationsAsOutbreakMSA
    | SetStationCrossContaminationMSA
    | MakeElementsInvisibleMSA
    | ShowElementsTraceMSA ;
