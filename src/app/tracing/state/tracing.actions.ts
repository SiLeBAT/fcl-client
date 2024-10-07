import { Action } from "@ngrx/store";
import { VisioReport } from "../visio/layout-engine/datatypes";
import {
    GraphType,
    FclData,
    SelectedElements,
    Position,
    SetTracingSettingsPayload,
    SetHighlightingSettingsPayload,
    Layout,
    MergeDeliveriesType,
    MapType,
    ShapeFileData,
    CrossContTraceType,
    DeliveryId,
    StationHighlightingRule,
    SetInvisibleElementsPayload,
    StationId,
    DeliveryHighlightingRule,
    JsonDataExtract,
    Color,
    TileServer,
} from "../data.model";
import { SetStationGroupsPayload } from "./../grouping/model";
import { ActivationStatus } from "../../shared/model/types";
import {
    ActiveConfigurationTabId,
    ActiveFilterTabId,
    ActiveHighlightingTabId,
    FilterTableSettings,
} from "../configuration/configuration.model";
import { ROASettings } from "../visio/model";
import { DeliveryEditRule, StationEditRule } from "../configuration/model";

export enum TracingActionTypes {
    TracingActivated = "[Tracing] Tracing active",
    LoadFclDataSuccessSOA = "[Tracing] Load Fcl Data Success",
    LoadFclDataFailureSOA = "[Tracing] Load Fcl Data Failure",
    LoadShapeFileSuccessSOA = "[Tracing] Load Shape File Success",
    LoadShapeFileFailureMSA = "[Tracing] Load Shape File Failure",
    SetGeojsonShapeBorderWidthSOA = "[Tracing] Set Geojson BorderWidth",
    SetGeojsonShapeBorderColorSOA = "[Tracing] Set Geojson BorderColor",
    GenerateVisioLayoutSuccess = "[Tracing] Generate Visio Layout Success",
    ShowGraphSettingsSOA = "[Tracing] Show Graph Settings",
    ShowConfigurationSideBarSOA = "[Tracing] Show Configuration Settings",
    ShowTableSettingsSOA = "[Tracing] Show Table Settings",
    SetGraphTypeSOA = "[Tracing] Set Graph Type",
    SetMapTypeSOA = "[Tracing] Set Map Type",
    SetTileServerSOA = "[Tracing] Set Tile Server",
    SetSchemaGraphLayoutSOA = "[Tracing] Set Schema Graph Layout",
    SetGisGraphLayoutSOA = "[Tracing] Set Gis Graph Layout",
    SetNodeSizeSOA = "[Tracing] Set Node Size",
    SetAdjustEdgeWidthToNodeSizeSOA = "[Tracing] Set Adjust Edge Width To Node Size",
    SetEdgeWidthSOA = "[Tracing] Set Edge Width",
    SetFontSizeSOA = "[Tracing] Set Font Size",
    SetMergeDeliveriesTypeSOA = "[Tracing] Set Merge Deliveries Type",
    ShowMergedDeliveriesCountsSOA = "[Tracing] Show Merged Deliveries Counts",
    ShowLegendSOA = "[Tracing] Show Legend",
    ShowZoomSOA = "[Tracing] Show Zoom",
    SetFitGraphToVisibleAreaSOA = "[Tracing] Set Fit Graph To Visible Area",
    SetSelectedElementsSOA = "[Tracing] Set Element Selection",
    SetSelectedStationsSOA = "[Tracing] Set Station Selection",
    SetSelectedDeliveriesSOA = "[Tracing] Set Delivery Selection",
    SetStationPositionsSOA = "[Tracing] Set Station Positions",
    SetStationPositionsAndLayoutSOA = "[Tracing] Set Station Positions And Layout",
    SetStationGroupsSOA = "[Tracing] Set Station Groups",
    SetTracingSettingsSOA = "[Tracing] Set Tracing Settings",
    SetCrossContTraceTypeSOA = "[Tracing] Set Cross Contamination Trace Type",
    SetHighlightingSettingsSOA = "[Tracing] Set Highlighting Settings",
    SetInvisibleElementsSOA = "[Tracing] Set Invisible Elements",
    SetActiveConfigurationTabIdSOA = "[Configuration Layout] Set Active Configuration Tab Id",
    SetActiveFilterTabIdSOA = "[Configuration Layout] Set Active Filter Tab Id",
    SetActiveHighlightingTabIdSOA = "[Configuration Layout] Set Active Highlighting Tab Id",
    SetStationFilterSOA = "[Configuration Layout] Set Station Filter Settings",
    ResetAllStationFiltersSOA = "[Configuration Layout] Reset All Station Filters",
    SetFilterStationTableColumnOrderSOA = "[Configuration Layout] Set Station Table Column Order",
    SetDeliveryFilterSOA = "[Configuration Layout] Set Delivery Filter Settings",
    ResetAllDeliveryFiltersSOA = "[Configuration Layout] Reset All Delivery Filters",
    SetFilterDeliveryTableColumnOrderSOA = "[Configuration Layout] Set Delivery Table Column Order",
    SetGhostStationSOA = "[Station Table] Show Ghost Station",
    SetGhostDeliverySOA = "[Delivery Table] Show Ghost Delivery",
    DeleteGhostElementSOA = "[Filter Table] Delete Ghost Element",
    SetHoverDeliveriesSOA = "[Station Properties] Hover Deliveries",
    SetROAReportSettingsSOA = "[ROA Report] Set ROA Report Settings",
    ResetTracingStateSOA = "[Tracing] Reset Tracing State",
    SetStationHighlightingRulesSOA = "[Station Highlighting] Set Station Highlighting Rules",
    SetStationHighlightingEditRulesSOA = "[Station Highlighting] Set Station Highlighting Edit Rules",
    SetDeliveryHighlightingRulesSOA = "[Delivery Highlighting] Set Delivery Highlighting Rules",
    SetDeliveryHighlightingEditRulesSOA = "[Delivery Highlighting] Set Delivery Highlighting Edit Rules",
    SetTabAnimationDoneSOA = "[Configuration] Tab animation done",
    SetConfigurationSideBarOpenedSOA = "[Configuration] Configuration sidebar opened",
    SetLastUnchangedJsonDataExtractSuccessSOA = "[Tracing] Refresh Last Unchanged JsonData Extract Success",
}

export class TracingActivated implements Action {
    readonly type = TracingActionTypes.TracingActivated;

    constructor(public payload: ActivationStatus) {}
}

export class LoadFclDataSuccessSOA implements Action {
    readonly type = TracingActionTypes.LoadFclDataSuccessSOA;

    constructor(public payload: { fclData: FclData }) {}
}

export class LoadFclDataFailureSOA implements Action {
    readonly type = TracingActionTypes.LoadFclDataFailureSOA;
}

export class LoadShapeFileSuccessSOA implements Action {
    readonly type = TracingActionTypes.LoadShapeFileSuccessSOA;

    constructor(public payload: { shapeFileData: ShapeFileData }) {
        console.log("2");
    }
}

export class LoadShapeFileFailureMSA implements Action {
    readonly type = TracingActionTypes.LoadShapeFileFailureMSA;
}

export class SetGeojsonBorderWidthSOA implements Action {
    readonly type = TracingActionTypes.SetGeojsonShapeBorderWidthSOA;

    constructor(public payload: { width: number }) {}
}

export class SetGeojsonBorderColorSOA implements Action {
    readonly type = TracingActionTypes.SetGeojsonShapeBorderColorSOA;

    constructor(public payload: { color: Color }) {}
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

export class SetTileServerSOA implements Action {
    readonly type = TracingActionTypes.SetTileServerSOA;

    constructor(public payload: { tileServer: TileServer }) {}
}

export class SetNodeSizeSOA implements Action {
    readonly type = TracingActionTypes.SetNodeSizeSOA;

    constructor(public payload: { nodeSize: number }) {}
}

export class SetEdgeWidthSOA implements Action {
    readonly type = TracingActionTypes.SetEdgeWidthSOA;

    constructor(public payload: { edgeWidth: number }) {}
}

export class SetAdjustEdgeWidthToNodeSizeSOA implements Action {
    readonly type = TracingActionTypes.SetAdjustEdgeWidthToNodeSizeSOA;

    constructor(public payload: { adjustEdgeWidthToNodeSize: boolean }) {}
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

export class SetFitGraphToVisibleAreaSOA implements Action {
    readonly type = TracingActionTypes.SetFitGraphToVisibleAreaSOA;

    constructor(public payload: { fitGraphToVisibleArea: boolean }) {}
}

export class SetSelectedElementsSOA implements Action {
    readonly type = TracingActionTypes.SetSelectedElementsSOA;

    constructor(public payload: { selectedElements: SelectedElements }) {}
}

export class SetSelectedStationsSOA implements Action {
    readonly type = TracingActionTypes.SetSelectedStationsSOA;

    constructor(public payload: { stationIds: StationId[] }) {}
}

export class SetSelectedDeliveriesSOA implements Action {
    readonly type = TracingActionTypes.SetSelectedDeliveriesSOA;

    constructor(public payload: { deliveryIds: DeliveryId[] }) {}
}

export class SetStationPositionsSOA implements Action {
    readonly type = TracingActionTypes.SetStationPositionsSOA;

    constructor(
        public payload: { stationPositions: { [key: string]: Position } },
    ) {}
}

export class SetStationPositionsAndLayoutSOA implements Action {
    readonly type = TracingActionTypes.SetStationPositionsAndLayoutSOA;

    constructor(
        public payload: {
            stationPositions: { [key: string]: Position };
            layout?: Layout;
        },
    ) {}
}

export class SetSchemaGraphLayoutSOA implements Action {
    readonly type = TracingActionTypes.SetSchemaGraphLayoutSOA;

    constructor(public payload: { layout: { zoom: number; pan: Position } }) {}
}

export class SetGisGraphLayoutSOA implements Action {
    readonly type = TracingActionTypes.SetGisGraphLayoutSOA;

    constructor(public payload: { layout: { zoom: number; pan: Position } }) {}
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

export class SetInvisibleElementsSOA implements Action {
    readonly type = TracingActionTypes.SetInvisibleElementsSOA;

    constructor(public payload: SetInvisibleElementsPayload) {}
}

export class SetActiveConfigurationTabIdSOA implements Action {
    readonly type = TracingActionTypes.SetActiveConfigurationTabIdSOA;

    constructor(
        public payload: { activeConfigurationTabId: ActiveConfigurationTabId },
    ) {}
}

export class SetActiveFilterTabIdSOA implements Action {
    readonly type = TracingActionTypes.SetActiveFilterTabIdSOA;

    constructor(public payload: { activeFilterTabId: ActiveFilterTabId }) {}
}

export class SetActiveHighlightingTabIdSOA implements Action {
    readonly type = TracingActionTypes.SetActiveHighlightingTabIdSOA;

    constructor(
        public payload: { activeHighlightingTabId: ActiveHighlightingTabId },
    ) {}
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
}

export class SetGhostStationSOA implements Action {
    readonly type = TracingActionTypes.SetGhostStationSOA;

    constructor(public payload: { stationId: StationId }) {}
}

export class SetGhostDeliverySOA implements Action {
    readonly type = TracingActionTypes.SetGhostDeliverySOA;

    constructor(public payload: { deliveryId: DeliveryId }) {}
}

export class DeleteGhostElementSOA implements Action {
    readonly type = TracingActionTypes.DeleteGhostElementSOA;
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

export class SetStationHighlightingRulesSOA implements Action {
    readonly type = TracingActionTypes.SetStationHighlightingRulesSOA;

    constructor(public payload: { rules: StationHighlightingRule[] }) {}
}

export class SetStationHighlightingEditRulesSOA implements Action {
    readonly type = TracingActionTypes.SetStationHighlightingEditRulesSOA;

    constructor(public payload: { editRules: StationEditRule[] }) {}
}

export class SetDeliveryHighlightingRulesSOA implements Action {
    readonly type = TracingActionTypes.SetDeliveryHighlightingRulesSOA;

    constructor(public payload: { rules: DeliveryHighlightingRule[] }) {}
}

export class SetDeliveryHighlightingEditRulesSOA implements Action {
    readonly type = TracingActionTypes.SetDeliveryHighlightingEditRulesSOA;

    constructor(public payload: { editRules: DeliveryEditRule[] }) {}
}

export class SetTabAnimationDoneSOA implements Action {
    readonly type = TracingActionTypes.SetTabAnimationDoneSOA;
}

export class SetConfigurationSideBarOpenedSOA implements Action {
    readonly type = TracingActionTypes.SetConfigurationSideBarOpenedSOA;
}

export class SetLastUnchangedJsonDataExtractSuccessSOA implements Action {
    readonly type =
        TracingActionTypes.SetLastUnchangedJsonDataExtractSuccessSOA;

    constructor(public payload: { extractData: JsonDataExtract }) {}
}

export type TracingActions =
    | TracingActivated
    | LoadFclDataSuccessSOA
    | LoadFclDataFailureSOA
    | LoadShapeFileSuccessSOA
    | LoadShapeFileFailureMSA
    | SetGeojsonBorderWidthSOA
    | SetGeojsonBorderColorSOA
    | GenerateVisioLayoutSuccess
    | ShowGraphSettingsSOA
    | ShowConfigurationSideBarSOA
    | ShowTableSettingsSOA
    | SetSchemaGraphLayoutSOA
    | SetGisGraphLayoutSOA
    | SetGraphTypeSOA
    | SetMapTypeSOA
    | SetTileServerSOA
    | SetNodeSizeSOA
    | SetAdjustEdgeWidthToNodeSizeSOA
    | SetEdgeWidthSOA
    | SetFontSizeSOA
    | SetMergeDeliveriesTypeSOA
    | ShowMergedDeliveriesCountsSOA
    | ShowLegendSOA
    | ShowZoomSOA
    | SetFitGraphToVisibleAreaSOA
    | SetSelectedElementsSOA
    | SetSelectedStationsSOA
    | SetSelectedDeliveriesSOA
    | SetStationPositionsSOA
    | SetStationPositionsAndLayoutSOA
    | SetStationGroupsSOA
    | SetTracingSettingsSOA
    | SetCrossContTraceTypeSOA
    | SetHighlightingSettingsSOA
    | SetInvisibleElementsSOA
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
    | DeleteGhostElementSOA
    | SetGhostStationSOA
    | SetGhostDeliverySOA
    | SetHoverDeliveriesSOA
    | ResetTracingStateSOA
    | SetStationHighlightingRulesSOA
    | SetStationHighlightingEditRulesSOA
    | SetDeliveryHighlightingRulesSOA
    | SetDeliveryHighlightingEditRulesSOA
    | SetTabAnimationDoneSOA
    | SetConfigurationSideBarOpenedSOA
    | SetLastUnchangedJsonDataExtractSuccessSOA;
