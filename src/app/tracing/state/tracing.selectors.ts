import { createFeatureSelector, createSelector } from '@ngrx/store';
import { STATE_SLICE_NAME } from './tracing.reducers';
import { TracingState } from '../state.model';
import { DeliveriesTabId, FilterTabId, HighlightingTabId, StationsTabId } from '../configuration/configuration.constants';

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

export const getSelectedElements = createSelector(
    getFclData,
    (fclData) => fclData.graphSettings.selectedElements
);

export const getMakeElementsInvisibleInputState = createSelector(
    getHighlightingSettings,
    getSelectedElements,
    getTracingSettings,
    (highlightingSettings, selectedElements, tracingSettings) => ({
        highlightingSettings: highlightingSettings,
        selectedElements: selectedElements,
        tracingSettings: tracingSettings
    })
);

export const getStationHighlightingSettings = createSelector(
    getHighlightingSettings,
    (highlightingSettings) => highlightingSettings.stations
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

export const selectDataServiceInputState = createSelector(
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

export const selectSharedGraphState = createSelector(
    selectDataServiceInputState,
    getGraphSettings,
    (basicGraphData, graphSettings) => ({
        ...basicGraphData,
        selectedElements: graphSettings.selectedElements,
        mergeDeliveriesType: graphSettings.mergeDeliveriesType,
        showMergedDeliveriesCounts: graphSettings.showMergedDeliveriesCounts,
        fontSize: graphSettings.fontSize,
        nodeSize: graphSettings.nodeSize,
        ghostStation: graphSettings.ghostStation,
        ghostDelivery: graphSettings.ghostDelivery,
        hoverDeliveries: graphSettings.hoverDeliveries
    })
);

const selectSchemaGraphPositions = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.stationPositions
);

const selectSchemaGraphLayout = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.schemaLayout
);

export const selectSchemaGraphState = createSelector(
    selectSharedGraphState,
    selectSchemaGraphPositions,
    selectSchemaGraphLayout,
    (sharedGraphState, positions, layout) => ({
        ...sharedGraphState,
        stationPositions: positions,
        layout: layout
    })
);

export const getROAReportData = createSelector(
    getFclElements,
    selectSchemaGraphState,
    getROASettings,
    (fclElements, schemaGraphState, roaSettings) => ({
        schemaGraphState: schemaGraphState,
        roaSettings: roaSettings,
        samples: fclElements.samples
    })
);

const selectGisGraphLayout = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.gisLayout
);

const selectMapType = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.mapType
);

const selectShapeFileData = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.shapeFileData
);

export const selectGisGraphState = createSelector(
    selectSharedGraphState,
    selectGisGraphLayout,
    selectMapType,
    selectShapeFileData,
    (sharedGraphState, layout, mapType, shapeFileData) => ({
        ...sharedGraphState,
        layout: layout,
        mapType: mapType,
        shapeFileData: shapeFileData
    })
);

export const getMapConfig = createSelector(
    selectGisGraphLayout,
    selectMapType,
    selectShapeFileData,
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
    selectDataServiceInputState,
    selectSchemaGraphPositions,
    (dataServiceInputState, positions) => ({
        ...dataServiceInputState,
        stationPositions: positions
    })
);

export const getActiveConfigurationTabId = createSelector(
    getTracingFeatureState,
    state => state.configurationTabIndices.activeConfigurationTabId
);

export const getActiveFilterTabId = createSelector(
    getTracingFeatureState,
    state => state.configurationTabIndices.activeFilterTabId
);

export const getActiveHighlightingTabId = createSelector(
    getTracingFeatureState,
    state => state.configurationTabIndices.activeHighlightingTabId
);

export const getIsFilterStationTabActive = createSelector(
    getTracingFeatureState,
    state => (
        state.showConfigurationSideBar &&
        state.configurationTabIndices.activeFilterTabId === StationsTabId &&
        state.configurationTabIndices.activeConfigurationTabId === FilterTabId
    )
);

export const getIsFilterDeliveryTabActive = createSelector(
    getTracingFeatureState,
    state => (
        state.showConfigurationSideBar &&
        state.configurationTabIndices.activeFilterTabId === DeliveriesTabId &&
        state.configurationTabIndices.activeConfigurationTabId === FilterTabId
    )
);

export const getIsHighlightingStationTabActive = createSelector(
    getTracingFeatureState,
    state => (
        state.showConfigurationSideBar &&
        state.configurationTabIndices.activeHighlightingTabId === StationsTabId &&
        state.configurationTabIndices.activeConfigurationTabId === HighlightingTabId
    )
);

export const getIsHighlightingDeliveryTabActive = createSelector(
    getTracingFeatureState,
    state => (
        state.showConfigurationSideBar &&
        state.configurationTabIndices.activeHighlightingTabId === DeliveriesTabId &&
        state.configurationTabIndices.activeConfigurationTabId === HighlightingTabId
    )
);

const selectFilterSettings = createSelector(
    getTracingFeatureState,
    state => state.filterSettings
);

const selectStationFilterSettings = createSelector(
    selectFilterSettings,
    (filterSettings) => filterSettings.stationFilter
);

export const selectStationFilterState = createSelector(
    selectDataServiceInputState,
    selectStationFilterSettings,
    (dataServiceInputState, stationFilterSettings) => ({
        dataServiceInputState: dataServiceInputState,
        filterTableState: stationFilterSettings
    })
);

export const getHighlightingConfigurationSettings = createSelector(
    getTracingFeatureState,
    state => state.highlightingConfigurationSettings
);

export const selectStationHighlightingState = createSelector(
    selectDataServiceInputState,
    getStationHighlightingSettings,
    getHighlightingConfigurationSettings,
    (dataServiceInputState, stationHighlightingSettings, highlightingConfigs) => ({
        dataServiceInputState: dataServiceInputState,
        highlightingState: stationHighlightingSettings,
        editIndex: highlightingConfigs.colorsAndShapesSettings.editIndex
    })
);

const selectDeliveryFilterSettings = createSelector(
    selectFilterSettings,
    (filterSettings) => filterSettings.deliveryFilter
);

export const selectDeliveryFilterState = createSelector(
    selectDataServiceInputState,
    selectDeliveryFilterSettings,
    (dataServiceInputState, deliveryFilterSettings) => ({
        dataServiceInputState: dataServiceInputState,
        filterTableState: deliveryFilterSettings
    })
);
