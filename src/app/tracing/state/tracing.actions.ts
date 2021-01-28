import { Action } from '@ngrx/store';
import { VisioReport } from '../visio/layout-engine/datatypes';
import {
    GraphType, FclData, SelectedElements, Position,
    SetTracingSettingsPayload, SetHighlightingSettingsPayload, Layout, MergeDeliveriesType, MapType, ShapeFileData,
    ROASettings,
    CrossContTraceType,
    DeliveryId,
    StationHighlightingData
} from '../data.model';
import { SetStationGroupsPayload } from './../grouping/model';
import { ActivationStatus } from '../../shared/model/types';
import { ActiveConfigurationTabId, ActiveFilterTabId, ActiveHighlightingTabId, FilterTableSettings } from '../configuration/configuration.model';

export enum TracingActionTypes {
    TracingActivated = '[Tracing] Tracing active',
    LoadFclDataSuccess = '[Tracing] Load Fcl Data Success',
    LoadFclDataFailure = '[Tracing] Load Fcl Data Failure',
    LoadShapeFileSuccessSOA = '[Tracing] Load Shape File Success',
    LoadShapeFileFailureMSA = '[Tracing] Load Shape File Failure',
    GenerateVisioLayoutSuccess = '[Tracing] Generate Visio Layout Success',
    ShowGraphSettingsSOA = '[Tracing] Show Graph Settings',
    ShowConfigurationSideBarSOA = '[Tracing] Show Configuration Settings',
    ShowTableSettingsSOA = '[Tracing] Show Table Settings',
    SetGraphTypeSOA = '[Tracing] Set Graph Type',
    SetMapTypeSOA = '[Tracing] Set Map Type',
    SetSchemaGraphLayoutSOA = '[Tracing] Set Schema Graph Layout',
    SetGisGraphLayoutSOA = '[Tracing] Set Gis Graph Layout',
    SetNodeSizeSOA = '[Tracing] Set Node Size',
    SetFontSizeSOA = '[Tracing] Set Font Size',
    SetMergeDeliveriesTypeSOA = '[Tracing] Set Merge Deliveries Type',
    ShowMergedDeliveriesCountsSOA = '[Tracing] Show Merged Deliveries Counts',
    ShowLegendSOA = '[Tracing] Show Legend',
    ShowZoomSOA = '[Tracing] Show Zoom',
    SetSelectedElementsSOA = '[Tracing] Set Element Selection',
    SetStationPositionsSOA = '[Tracing] Set Station Positions',
    SetStationPositionsAndLayoutSOA = '[Tracing] Set Station Positions And Layout',
    SetStationGroupsSOA = '[Tracing] Set Station Groups',
    SetTracingSettingsSOA = '[Tracing] Set Tracing Settings',
    SetCrossContTraceTypeSOA = '[Tracing] Set Cross Contamination Trace Type',
    SetHighlightingSettingsSOA = '[Tracing] Set Highlighting Settings',
    SetActiveConfigurationTabIdSOA = '[Configuration Layout] Set Active Configuration Tab Id',
    SetActiveFilterTabIdSOA = '[Configuration Layout] Set Active Filter Tab Id',
    SetActiveHighlightingTabIdSOA = '[Configuration Layout] Set Active Highlighting Tab Id',
    SetStationFilterSOA = '[Configuration Layout] Set Station Filter Settings',
    ResetAllStationFiltersSOA = '[Configuration Layout] Reset All Station Filters',
    SetFilterStationTableColumnOrderSOA = '[Configuration Layout] Set Station Table Column Order',
    SetDeliveryFilterSOA = '[Configuration Layout] Set Delivery Filter Settings',
    ResetAllDeliveryFiltersSOA = '[Configuration Layout] Reset All Delivery Filters',
    SetFilterDeliveryTableColumnOrderSOA = '[Configuration Layout] Set Delivery Table Column Order',
    ShowGhostStationMSA = '[Station Table] Show Ghost Station',
    ClearGhostStationMSA = '[Station Table] Clear Ghost Station',
    SetHoverDeliveriesSOA = '[Station Properties] Hover Deliveries',
    SetROAReportSettingsSOA = '[ROA Report] Set ROA Report Settings',
    ResetTracingStateSOA = '[Tracing] Reset Tracing State',
    SetStationHighlightingRulesSOA = '[Colours and Shapes Highlighting] Set Station Highlighting Rules'
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

export class LoadShapeFileSuccessSOA implements Action {
    readonly type = TracingActionTypes.LoadShapeFileSuccessSOA;

    constructor(public payload: { shapeFileData: ShapeFileData }) {}
}

export class LoadShapeFileFailureMSA implements Action {
    readonly type = TracingActionTypes.LoadShapeFileFailureMSA;
}

export class GenerateVisioLayoutSuccess implements Action {
    readonly type = TracingActionTypes.GenerateVisioLayoutSuccess;

    constructor(public payload: VisioReport) {}
}

export class ShowGraphSettingsSOA implements Action {
    readonly type = TracingActionTypes.ShowGraphSettingsSOA;

    constructor(public payload: { showGraphSettings: boolean }) {}
}

export class ShowConfigurationSideBarSOA implements Action {
    readonly type = TracingActionTypes.ShowConfigurationSideBarSOA;

    constructor(public payload: { showConfigurationSideBar: boolean }) {}
}

export class ShowTableSettingsSOA implements Action {
    readonly type = TracingActionTypes.ShowTableSettingsSOA;

    constructor(public payload: { showTableSettings: boolean }) {}
}

export class SetGraphTypeSOA implements Action {
    readonly type = TracingActionTypes.SetGraphTypeSOA;

    constructor(public payload: { graphType: GraphType }) {}
}

export class SetMapTypeSOA implements Action {
    readonly type = TracingActionTypes.SetMapTypeSOA;

    constructor(public payload: { mapType: MapType }) {}
}

export class SetNodeSizeSOA implements Action {
    readonly type = TracingActionTypes.SetNodeSizeSOA;

    constructor(public payload: { nodeSize: number }) {}
}

export class SetFontSizeSOA implements Action {
    readonly type = TracingActionTypes.SetFontSizeSOA;

    constructor(public payload: { fontSize: number }) {}
}

export class SetMergeDeliveriesTypeSOA implements Action {
    readonly type = TracingActionTypes.SetMergeDeliveriesTypeSOA;

    constructor(public payload: { mergeDeliveriesType: MergeDeliveriesType }) {}
}

export class ShowMergedDeliveriesCountsSOA implements Action {
    readonly type = TracingActionTypes.ShowMergedDeliveriesCountsSOA;

    constructor(public payload: { showMergedDeliveriesCounts: boolean }) {}
}

export class ShowLegendSOA implements Action {
    readonly type = TracingActionTypes.ShowLegendSOA;

    constructor(public payload: boolean) {}
}

export class ShowZoomSOA implements Action {
    readonly type = TracingActionTypes.ShowZoomSOA;

    constructor(public payload: boolean) {}
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

export class SetCrossContTraceTypeSOA implements Action {
    readonly type = TracingActionTypes.SetCrossContTraceTypeSOA;

    constructor(public payload: { crossContTraceType: CrossContTraceType }) {}
}

export class SetHighlightingSettingsSOA implements Action {
    readonly type = TracingActionTypes.SetHighlightingSettingsSOA;

    constructor(public payload: SetHighlightingSettingsPayload) {}
}

export class SetActiveConfigurationTabIdSOA implements Action {
    readonly type = TracingActionTypes.SetActiveConfigurationTabIdSOA;

    constructor(public payload: { activeConfigurationTabId: ActiveConfigurationTabId }) {}
}

export class SetActiveFilterTabIdSOA implements Action {
    readonly type = TracingActionTypes.SetActiveFilterTabIdSOA;

    constructor(public payload: { activeFilterTabId: ActiveFilterTabId }) {}
}

export class SetActiveHighlightingTabIdSOA implements Action {
    readonly type = TracingActionTypes.SetActiveHighlightingTabIdSOA;

    constructor(public payload: { activeHighlightingTabId: ActiveHighlightingTabId }) {}
}

export class SetFilterStationTableColumnOrderSOA implements Action {
    readonly type = TracingActionTypes.SetFilterStationTableColumnOrderSOA;

    constructor(public payload: { columnOrder: string[] }) {}
}

export class SetStationFilterSOA implements Action {
    readonly type = TracingActionTypes.SetStationFilterSOA;

    constructor(public payload: { settings: FilterTableSettings }) {}
}

export class ResetAllStationFiltersSOA implements Action {
    readonly type = TracingActionTypes.ResetAllStationFiltersSOA;

    constructor() {}
}

export class SetFilterDeliveryTableColumnOrderSOA implements Action {
    readonly type = TracingActionTypes.SetFilterDeliveryTableColumnOrderSOA;

    constructor(public payload: { columnOrder: string[] }) {}
}

export class SetDeliveryFilterSOA implements Action {
    readonly type = TracingActionTypes.SetDeliveryFilterSOA;

    constructor(public payload: { settings: FilterTableSettings }) {}
}

export class ResetAllDeliveryFiltersSOA implements Action {
    readonly type = TracingActionTypes.ResetAllDeliveryFiltersSOA;

    constructor() {}
}

export class ShowGhostStationMSA implements Action {
    readonly type = TracingActionTypes.ShowGhostStationMSA;

    constructor(public payload: { stationId: string }) {}
}

export class ClearGhostStationMSA implements Action {
    readonly type = TracingActionTypes.ClearGhostStationMSA;
}

export class SetHoverDeliveriesSOA implements Action {
    readonly type = TracingActionTypes.SetHoverDeliveriesSOA;

    constructor(public payload: { deliveryIds: DeliveryId[] }) {}
}

export class SetROAReportSettingsSOA implements Action {
    readonly type = TracingActionTypes.SetROAReportSettingsSOA;

    constructor(public payload: { roaSettings: ROASettings }) {}
}

export class ResetTracingStateSOA implements Action {
    readonly type = TracingActionTypes.ResetTracingStateSOA;
}

// export class AddColoursAndShapesHighlightingRuleSOA implements Action {
export class SetStationHighlightingRulesSOA implements Action {
    readonly type = TracingActionTypes.SetStationHighlightingRulesSOA;

    constructor(public payload: { stationHighlightingData: StationHighlightingData[] }) {}
}

export type TracingActions =
      TracingActivated
    | LoadFclDataSuccess
    | LoadFclDataFailure
    | LoadShapeFileSuccessSOA
    | LoadShapeFileFailureMSA
    | GenerateVisioLayoutSuccess
    | ShowGraphSettingsSOA
    | ShowConfigurationSideBarSOA
    | ShowTableSettingsSOA
    | SetSchemaGraphLayoutSOA
    | SetGisGraphLayoutSOA
    | SetGraphTypeSOA
    | SetMapTypeSOA
    | SetNodeSizeSOA
    | SetFontSizeSOA
    | SetMergeDeliveriesTypeSOA
    | ShowMergedDeliveriesCountsSOA
    | ShowLegendSOA
    | ShowZoomSOA
    | SetSelectedElementsSOA
    | SetStationPositionsSOA
    | SetStationPositionsAndLayoutSOA
    | SetStationGroupsSOA
    | SetTracingSettingsSOA
    | SetCrossContTraceTypeSOA
    | SetHighlightingSettingsSOA
    | SetActiveConfigurationTabIdSOA
    | SetActiveFilterTabIdSOA
    | SetActiveHighlightingTabIdSOA
    | SetFilterStationTableColumnOrderSOA
    | SetStationFilterSOA
    | ResetAllStationFiltersSOA
    | SetFilterDeliveryTableColumnOrderSOA
    | SetDeliveryFilterSOA
    | ResetAllDeliveryFiltersSOA
    | SetROAReportSettingsSOA
    | ShowGhostStationMSA
    | ClearGhostStationMSA
    | SetHoverDeliveriesSOA
    | ResetTracingStateSOA
    | SetStationHighlightingRulesSOA;
