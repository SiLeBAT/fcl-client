import { Action } from '@ngrx/store';
import {
    ClearInvisibilitiesOptions, ClearOutbreaksOptions, DeliveryId, Layout, Position, SelectedElements,
    SetOutbreaksOptions,
    ShowElementsTraceParams, StationId
} from './data.model';
import { EdgeId, NodeId, SelectedGraphElements } from './graph/graph.model';

export enum TracingActionTypes {
    ClearTraceMSA = '[Tracing] Clear Trace',
    ClearInvisibilitiesMSA = '[Tracing] Clear Invisibilities',
    ShowStationPropertiesMSA = '[Tracing] Show Station Properties',
    ClearOutbreaksMSA = '[Tracing] Clear Outbreaks',
    MarkElementsAsOutbreakMSA = '[Tracing] Mark Elements as Outbreak',
    SetStationCrossContaminationMSA = '[Tracing] Set Station Cross Contamination',
    SetStationKillContaminationMSA = '[Tracing] Set Station Kill Contamination',
    MakeElementsInvisibleMSA = '[Tracing] Make Elements Invisible',
    ShowDeliveryPropertiesMSA = '[Tracing] Show Delivery Properties',
    ShowElementsTraceMSA = '[Tracing] Show Elements Trace',
    SetSelectedGraphElementsMSA = '[Graph] Set Selected Graph Elements',
    FocusStationSSA = '[Graph] Focus Station',
    FocusDeliverySSA = '[Graph] Focus Delivery',
    FocusGraphElementSSA = '[Graph] Focus Graph Element',
    SetLastUnchangedJsonDataExtractMSA = '[Tracing] Set Last Unchanged JsonData Extract',
    SetStationPositionsAndLayoutMSA = '[Tracing] Set Station Positions And Layout MSA',
}

export class ClearTraceMSA implements Action {
    readonly type = TracingActionTypes.ClearTraceMSA;
}

// export class ClearOutbreakStationsMSA implements Action {
//     readonly type = TracingActionTypes.ClearOutbreakStationsMSA;
// }

export class ClearInvisibilitiesMSA implements Action {
    readonly type = TracingActionTypes.ClearInvisibilitiesMSA;

    constructor(public payload: ClearInvisibilitiesOptions) {}
}

export class ClearOutbreaksMSA implements Action {
    readonly type = TracingActionTypes.ClearOutbreaksMSA;

    constructor(public payload: ClearOutbreaksOptions) {}
}

export class ShowStationPropertiesMSA implements Action {
    readonly type = TracingActionTypes.ShowStationPropertiesMSA;

    constructor(public payload: { stationId: string }) {}
}

export class ShowDeliveryPropertiesMSA implements Action {
    readonly type = TracingActionTypes.ShowDeliveryPropertiesMSA;

    constructor(public payload: { deliveryIds: string[] }) {}
}

// export class MarkStationsAsOutbreakMSA implements Action {
//     readonly type = TracingActionTypes.MarkStationsAsOutbreakMSA;

//     constructor(public payload: { stationIds: string[]; outbreak: boolean }) {}
// }

export class MarkElementsAsOutbreakMSA implements Action {
    readonly type = TracingActionTypes.MarkElementsAsOutbreakMSA;

    constructor(public payload: SetOutbreaksOptions) {}
}

export class SetStationCrossContaminationMSA implements Action {
    readonly type = TracingActionTypes.SetStationCrossContaminationMSA;

    constructor(public payload: { stationIds: string[]; crossContamination: boolean }) {}
}

export class SetStationKillContaminationMSA implements Action {
    readonly type = TracingActionTypes.SetStationKillContaminationMSA;

    constructor(public payload: { stationIds: string[]; killContamination: boolean }) {}
}

export class MakeElementsInvisibleMSA implements Action {
    readonly type = TracingActionTypes.MakeElementsInvisibleMSA;

    constructor(public payload: SelectedElements) {}
}

export class ShowElementsTraceMSA implements Action {
    readonly type = TracingActionTypes.ShowElementsTraceMSA;

    constructor(public payload: ShowElementsTraceParams) {}
}

export class SetSelectedGraphElementsMSA implements Action {
    readonly type = TracingActionTypes.SetSelectedGraphElementsMSA;

    constructor(public payload: { selectedElements: SelectedGraphElements; maintainOffGraphSelection: boolean }) {}
}

export class FocusStationSSA implements Action {
    readonly type = TracingActionTypes.FocusStationSSA;

    constructor(public payload: { stationId: StationId }) {}
}

export class FocusDeliverySSA implements Action {
    readonly type = TracingActionTypes.FocusDeliverySSA;

    constructor(public payload: { deliveryId: DeliveryId }) {}
}

export class FocusGraphElementSSA implements Action {
    readonly type = TracingActionTypes.FocusGraphElementSSA;

    constructor(public payload: { elementId: NodeId | EdgeId }) {}
}

export class SetLastUnchangedJsonDataExtractMSA implements Action {
    readonly type = TracingActionTypes.SetLastUnchangedJsonDataExtractMSA;
}

export class SetStationPositionsAndLayoutMSA implements Action {
    readonly type = TracingActionTypes.SetStationPositionsAndLayoutMSA;

    constructor(public payload: { stationPositions: { [key: string]: Position }; layout: Layout }) {}
}


export type TracingActions =
      ClearTraceMSA
    // | ClearOutbreakStationsMSA
    | ClearOutbreaksMSA
    | ClearInvisibilitiesMSA
    | ShowStationPropertiesMSA
    // | MarkStationsAsOutbreakMSA
    | MarkElementsAsOutbreakMSA
    | SetStationCrossContaminationMSA
    | MakeElementsInvisibleMSA
    | ShowElementsTraceMSA
    | SetSelectedGraphElementsMSA
    | FocusStationSSA
    | FocusDeliverySSA
    | FocusGraphElementSSA
    | SetLastUnchangedJsonDataExtractMSA
    | SetStationPositionsAndLayoutMSA;
