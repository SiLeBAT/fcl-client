import { createFeatureSelector, createSelector } from '@ngrx/store';
import { STATE_SLICE_NAME } from './tracing.reducers';
import { TracingState } from '../state.model';

// SELECTORS
export const getTracingFeatureState = createFeatureSelector<TracingState>(STATE_SLICE_NAME);

export const getFclData = createSelector(
    getTracingFeatureState,
    state => state.fclData
);

export const getTracingActive = createSelector(
    getTracingFeatureState,
    state => state.tracingActive
);

export const getVisioReport = createSelector(
    getTracingFeatureState,
    state => state.visioReport
);

export const getROASettings = createSelector(
    getTracingFeatureState,
    state => state.roaSettings
);

export const getGraphSettings = createSelector(
    getFclData,
    (fclData) => fclData.graphSettings
);

export const getShowZoom = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.showZoom
);

export const getShowLegend = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.showLegend
);

export const getMergeDeliveriesType = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.mergeDeliveriesType
);

export const getFclElements = createSelector(
    getFclData,
    (fclData) => fclData.fclElements
);

export const getGroupSettings = createSelector(
    getFclData,
    (fclData) => fclData.groupSettings
);

export const getTracingSettings = createSelector(
    getFclData,
    (fclData) => fclData.tracingSettings
);

export const getHighlightingSettings = createSelector(
    getFclData,
    (fclData) => fclData.graphSettings.highlightingSettings
);

export const getNodeSize = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.nodeSize
);

export const getFontSize = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.fontSize
);

export const getGraphType = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.type
);

export const getShowConfigurationSideBar = createSelector(
    getTracingFeatureState,
    (state) => state.showConfigurationSideBar
);

export const getBasicGraphData = createSelector(
    getFclElements,
    getGroupSettings,
    getTracingSettings,
    getHighlightingSettings,
    getGraphSettings,
    (fclElements, groupSettings, tracingSettings, highlightingSettings, graphSettings) => ({
        fclElements: fclElements,
        groupSettings: groupSettings,
        tracingSettings: tracingSettings,
        highlightingSettings: highlightingSettings,
        selectedElements: graphSettings.selectedElements
    })
);

export const getGraphData = createSelector(
    getBasicGraphData,
    getMergeDeliveriesType,
    (basicGraphData, mergeDeliveriesType) => ({
        ...basicGraphData,
        mergeDeliveriesType: mergeDeliveriesType
    })
);

export const getSchemaGraphData = createSelector(
    getBasicGraphData,
    getGraphSettings,
    (basicGraphData, graphSettings) => ({
        ...basicGraphData,
        stationPositions: graphSettings.stationPositions,
        selectedElements: graphSettings.selectedElements,
        mergeDeliveriesType: graphSettings.mergeDeliveriesType,
        showMergedDeliveriesCounts: graphSettings.showMergedDeliveriesCounts,
        fontSize: graphSettings.fontSize,
        nodeSize: graphSettings.nodeSize,
        layout: graphSettings.schemaLayout,
        ghostStation: graphSettings.ghostStation
    })
);

export const getROAReportData = createSelector(
    getFclElements,
    getSchemaGraphData,
    getROASettings,
    (fclElements, schemaGraphState, roaSettings) => ({
        schemaGraphState: schemaGraphState,
        roaSettings: roaSettings,
        samples: fclElements.samples
    })
);

export const getGisGraphData = createSelector(
    getBasicGraphData,
    getGraphSettings,
    (basicGraphData, graphSettings) => ({
        ...basicGraphData,
        selectedElements: graphSettings.selectedElements,
        mergeDeliveriesType: graphSettings.mergeDeliveriesType,
        showMergedDeliveriesCounts: graphSettings.showMergedDeliveriesCounts,
        fontSize: graphSettings.fontSize,
        nodeSize: graphSettings.nodeSize,
        layout: graphSettings.gisLayout,
        mapType: graphSettings.mapType,
        shapeFileData: graphSettings.shapeFileData
    })
);

const getGisLayout = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.gisLayout
);
const getMapType = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.mapType
);
const getShapeFileData = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.shapeFileData
);

export const getMapConfig = createSelector(
    getGisLayout,
    getMapType,
    getShapeFileData,
    (gisLayout, mapType, shapeFileData) => ({
        layout: gisLayout,
        mapType: mapType,
        shapeFileData: shapeFileData
    })
);

export const getStyleConfig = createSelector(
    getNodeSize,
    getFontSize,
    (nodeSize, fontSize) => ({
        nodeSize: nodeSize,
        fontSize: fontSize
    })
);

export const getSchemaGraphLayout = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.schemaLayout
);

export const getGroupingData = createSelector(
    getBasicGraphData,
    getGraphSettings,
    (basicGraphData, graphSettings) => ({
        ...basicGraphData,
        stationPositions: graphSettings.stationPositions
    })
);

export const getConfigurationTabIndices = createSelector(
    getTracingFeatureState,
    state => state.configurationTabIndices
);

export const getIsFilterStationTabActive = createSelector(
    getTracingFeatureState,
    state => (
        state.showConfigurationSideBar &&
        state.configurationTabIndices.activeFilterTabIndex === 0 &&
        state.configurationTabIndices.activeMainTabIndex === 0
    )
);

export const getIsFilterDeliveryTabActive = createSelector(
    getTracingFeatureState,
    state => (
        state.showConfigurationSideBar &&
        state.configurationTabIndices.activeFilterTabIndex === 1 &&
        state.configurationTabIndices.activeMainTabIndex === 0
    )
);

export const getFilterSettings = createSelector(
    getTracingFeatureState,
    state => state.filterSettings
);

export const getStationFilterData = createSelector(
    getBasicGraphData,
    getFilterSettings,
    (basicGraphData, filterSettings) => ({
        graphState: basicGraphData,
        filterTableState: filterSettings.stationFilter
    })
);

export const getDeliveryFilterData = createSelector(
    getBasicGraphData,
    getFilterSettings,
    (basicGraphData, filterSettings) => ({
        graphState: basicGraphData,
        filterTableState: filterSettings.deliveryFilter
    })
);
