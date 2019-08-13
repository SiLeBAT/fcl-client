import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TracingState, STATE_SLICE_NAME } from './tracing.reducers';

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

export const getMergeDeliveries = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.mergeDeliveries
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

export const getTableSettings = createSelector(
    getFclData,
    fclData => fclData.tableSettings
);

export const getShowGraphSettings = createSelector(
    getTracingFeatureState,
    (state) => state.showGraphSettings
);

export const getShowDataTable = createSelector(
    getTracingFeatureState,
    (state) => state.showDataTable
);

export const getShowTableSettings = createSelector(
    getTracingFeatureState,
    (state) => state.showTableSettings
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
    getMergeDeliveries,
    (basicGraphData, mergeDeliveries) => ({
        ...basicGraphData,
        mergeDeliveries: mergeDeliveries
    })
);

export const getTableData = createSelector(
    getBasicGraphData,
    getTableSettings,
    (graphState, tableSettings) => ({
        graphState: graphState,
        tableSettings: tableSettings
    })
);

export const getSchemaGraphData = createSelector(
    getBasicGraphData,
    getGraphSettings,
    (basicGraphData, graphSettings) => ({
        ...basicGraphData,
        stationPositions: graphSettings.stationPositions,
        selectedElements: graphSettings.selectedElements,
        mergeDeliveries: graphSettings.mergeDeliveries,
        fontSize: graphSettings.fontSize,
        nodeSize: graphSettings.nodeSize,
        layout: graphSettings.schemaLayout
    })
);

export const getGisGraphData = createSelector(
    getBasicGraphData,
    getGraphSettings,
    (basicGraphData, graphSettings) => ({
        ...basicGraphData,
        selectedElements: graphSettings.selectedElements,
        mergeDeliveries: graphSettings.mergeDeliveries,
        fontSize: graphSettings.fontSize,
        nodeSize: graphSettings.nodeSize,
        layout: graphSettings.gisLayout
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
