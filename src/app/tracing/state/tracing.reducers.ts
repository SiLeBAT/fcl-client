import { TracingActions, TracingActionTypes } from './tracing.actions';
import { Constants } from '../util/constants';
import {
    FclData,
    MergeDeliveriesType,
    MapType,
    GraphType,
    CrossContTraceType,
    FclDataSourceInfo
} from '../data.model';

import { ModelDependentState, TracingState } from '../state.model';
import {
    ComplexRowFilterSettings,
    FilterTableSettings,
    ShowType,
    VisibilityFilterState,
    FilterSettings,
    ConfigurationTabIndex,
    HighlightingConfigurationSettings
} from '../configuration/configuration.model';
import { FilterTabId, StationsTabId } from '../configuration/configuration.constants';
import { DENOVO_DELIVERY_PROP_INT_TO_EXT_MAP, DENOVO_STATION_PROP_INT_TO_EXT_MAP } from '../io/data-mappings/data-mappings-v1';

export const STATE_SLICE_NAME = 'tracing';

export interface State {
    tracing: TracingState;
}

export const complexFilterSettings: ComplexRowFilterSettings = {
    conditions: []
};

const filterTableSettings: FilterTableSettings = {
    columnOrder: [],
    standardFilter: '',
    complexFilter: complexFilterSettings,
    predefinedFilter: ShowType.ALL,
    visibilityFilter: VisibilityFilterState.SHOW_ALL,
    columnFilters: []
};

const initialFilterSettings: FilterSettings = {
    stationFilter: {
        ...filterTableSettings,
        columnOrder: Constants.DEFAULT_TABLE_STATION_COLUMNS.toArray()
    },
    deliveryFilter: {
        ...filterTableSettings,
        columnOrder: Constants.DEFAULT_TABLE_DELIVERY_COLUMNS.toArray()
    }
};

const initialHighlightingConfigurationSettings: HighlightingConfigurationSettings = {
    stationEditRules: [],
    deliveryEditRules: []
};

const initialModelDependentState: ModelDependentState = {
    visioReport: null,
    roaSettings: null,
    filterSettings: initialFilterSettings,
    highlightingConfigurationSettings: initialHighlightingConfigurationSettings,
    lastUnchangedJsonDataExtract: {}
};

const initialData: FclData = createInitialFclDataState();

const initialTabIndices: ConfigurationTabIndex = {
    activeConfigurationTabId: FilterTabId,
    activeFilterTabId: StationsTabId,
    activeHighlightingTabId: StationsTabId
};

const initialState: TracingState = {
    fclData: initialData,
    ...initialModelDependentState,
    tracingActive: false,
    showConfigurationSideBar: false,
    configurationTabIndices: initialTabIndices,
    animatingTabCount: 0,
    isConfSideBarOpening: false,
    showGraphSettings: false
};

function createInitialFclDataSourceInfo(): FclDataSourceInfo {
    return {
        propMaps: {
            stationPropMap: DENOVO_STATION_PROP_INT_TO_EXT_MAP.toObject(),
            deliveryPropMap: DENOVO_DELIVERY_PROP_INT_TO_EXT_MAP.toObject()
        }
    };
}

export function createInitialFclDataState(): FclData {
    return {
        source: createInitialFclDataSourceInfo(),
        fclElements: {
            stations: [],
            deliveries: [],
            samples: []
        },
        graphSettings: {
            type: Constants.DEFAULT_GRAPH_TYPE,
            nodeSize: Constants.DEFAULT_GRAPH_NODE_SIZE,
            adjustEdgeWidthToNodeSize: Constants.DEFAULT_GRAPH_ADJUST_EDGE_WIDTH_TO_NODE_SIZE,
            edgeWidth: Constants.DEFAULT_GRAPH_EDGE_WIDTH,
            fontSize: Constants.DEFAULT_GRAPH_FONT_SIZE,
            mergeDeliveriesType: MergeDeliveriesType.NO_MERGE,
            showMergedDeliveriesCounts: false,
            skipUnconnectedStations: Constants.DEFAULT_SKIP_UNCONNECTED_STATIONS,
            showLegend: Constants.DEFAULT_GRAPH_SHOW_LEGEND,
            showZoom: Constants.DEFAULT_GRAPH_SHOW_ZOOM,
            fitGraphToVisibleArea: Constants.DEFAULT_FIT_GRAPH_TO_VISIBLE_AREA,
            selectedElements: {
                stations: [],
                deliveries: []
            },
            stationPositions: {},
            highlightingSettings: {
                invisibleStations: [],
                invisibleDeliveries: [],
                stations: [],
                deliveries: []
            },
            schemaLayout: null,
            gisLayout: null,
            mapType: Constants.DEFAULT_MAP_TYPE,
            shapeFileData: null,
            ghostStation: null,
            ghostDelivery: null,
            hoverDeliveries: []
        },
        tracingSettings: {
            crossContTraceType: CrossContTraceType.USE_INFERED_DELIVERY_DATES_LIMITS,
            stations: [],
            deliveries: []
        },
        groupSettings: []
    };
}

// REDUCER
export function reducer(state: TracingState = initialState, action: TracingActions): TracingState {
    switch (action.type) {
        case TracingActionTypes.SetConfigurationSideBarOpenedSOA:
            return {
                ...state,
                isConfSideBarOpening: false
            };
        case TracingActionTypes.SetTabAnimationDoneSOA:
            return {
                ...state,
                animatingTabCount: Math.max(state.animatingTabCount - 1, 0)
            };
        case TracingActionTypes.TracingActivated:
            return {
                ...state,
                tracingActive: action.payload.isActivated
            };

        case TracingActionTypes.LoadFclDataSuccessSOA:
            action.payload.fclData.graphSettings.mapType = state.fclData.graphSettings.mapType;
            action.payload.fclData.graphSettings.shapeFileData = state.fclData.graphSettings.shapeFileData;

            return {
                ...state,
                fclData: action.payload.fclData,
                ...initialModelDependentState
            };

        case TracingActionTypes.GenerateVisioLayoutSuccess:
            return {
                ...state,
                visioReport: action.payload
            };

        case TracingActionTypes.ShowGraphSettingsSOA:
            return {
                ...state,
                showGraphSettings: action.payload.showGraphSettings
            };

        case TracingActionTypes.ShowConfigurationSideBarSOA:
            return {
                ...state,
                showConfigurationSideBar: action.payload.showConfigurationSideBar,
                isConfSideBarOpening: action.payload.showConfigurationSideBar
            };

        case TracingActionTypes.SetGraphTypeSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        type: action.payload.graphType
                    }
                }
            };

        case TracingActionTypes.SetMapTypeSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        type: GraphType.GIS,
                        mapType: action.payload.mapType
                    }
                }
            };

        case TracingActionTypes.LoadShapeFileSuccessSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        type: GraphType.GIS,
                        mapType: MapType.SHAPE_FILE,
                        shapeFileData: action.payload.shapeFileData
                    }
                }
            };

        case TracingActionTypes.SetNodeSizeSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        nodeSize: action.payload.nodeSize,
                        edgeWidth: state.fclData.graphSettings.adjustEdgeWidthToNodeSize ?
                            Constants.NODE_SIZE_TO_EDGE_WIDTH_MAP.get(action.payload.nodeSize) :
                            state.fclData.graphSettings.edgeWidth
                    }
                }
            };

        case TracingActionTypes.SetAdjustEdgeWidthToNodeSizeSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        adjustEdgeWidthToNodeSize: action.payload.adjustEdgeWidthToNodeSize,
                        edgeWidth: action.payload.adjustEdgeWidthToNodeSize ?
                            Constants.NODE_SIZE_TO_EDGE_WIDTH_MAP.get(state.fclData.graphSettings.nodeSize) :
                            state.fclData.graphSettings.edgeWidth
                    }
                }
            };

        case TracingActionTypes.SetEdgeWidthSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        edgeWidth: action.payload.edgeWidth
                    }
                }
            };

        case TracingActionTypes.SetFontSizeSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        fontSize: action.payload.fontSize
                    }
                }
            };

        case TracingActionTypes.SetMergeDeliveriesTypeSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        mergeDeliveriesType: action.payload.mergeDeliveriesType
                    }
                }
            };

        case TracingActionTypes.ShowMergedDeliveriesCountsSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        showMergedDeliveriesCounts: action.payload.showMergedDeliveriesCounts
                    }
                }
            };

        case TracingActionTypes.ShowLegendSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        showLegend: action.payload
                    }
                }
            };

        case TracingActionTypes.ShowZoomSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        showZoom: action.payload
                    }
                }
            };

        case TracingActionTypes.SetFitGraphToVisibleAreaSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        fitGraphToVisibleArea: action.payload.fitGraphToVisibleArea
                    }
                }
            };

        case TracingActionTypes.SetStationFilterSOA:
            return {
                ...state,
                filterSettings: {
                    ...state.filterSettings,
                    stationFilter: action.payload.settings
                }
            };

        case TracingActionTypes.SetDeliveryFilterSOA:
            return {
                ...state,
                filterSettings: {
                    ...state.filterSettings,
                    deliveryFilter: action.payload.settings
                }
            };

        case TracingActionTypes.ResetAllStationFiltersSOA:
            return {
                ...state,
                filterSettings: {
                    ...initialFilterSettings,
                    stationFilter: {
                        ...filterTableSettings,
                        columnOrder: state.filterSettings.stationFilter.columnOrder
                    }
                }
            };

        case TracingActionTypes.ResetAllDeliveryFiltersSOA:
            return {
                ...state,
                filterSettings: {
                    ...initialFilterSettings,
                    deliveryFilter: {
                        ...filterTableSettings,
                        columnOrder: state.filterSettings.deliveryFilter.columnOrder
                    }
                }
            };

        case TracingActionTypes.ResetTracingStateSOA:
            return initialState;

        case TracingActionTypes.SetFilterStationTableColumnOrderSOA: {
            const newColumnOrder = action.payload.columnOrder;
            const oldColumnFilters = state.filterSettings.stationFilter.columnFilters;
            const newColumnFilters = oldColumnFilters.filter(f => newColumnOrder.includes(f.filterProp));

            return {
                ...state,
                filterSettings: {
                    ...state.filterSettings,
                    stationFilter: {
                        ...state.filterSettings.stationFilter,
                        columnOrder: newColumnOrder,
                        columnFilters: oldColumnFilters.length === newColumnOrder.length ? oldColumnFilters : newColumnFilters
                    }
                }
            };
        }

        case TracingActionTypes.SetFilterDeliveryTableColumnOrderSOA: {
            const newColumnOrder = action.payload.columnOrder;
            const oldColumnFilters = state.filterSettings.deliveryFilter.columnFilters;
            const newColumnFilters = oldColumnFilters.filter(f => newColumnOrder.includes(f.filterProp));

            return {
                ...state,
                filterSettings: {
                    ...state.filterSettings,
                    deliveryFilter: {
                        ...state.filterSettings.deliveryFilter,
                        columnOrder: newColumnOrder,
                        columnFilters: oldColumnFilters.length === newColumnOrder.length ? oldColumnFilters : newColumnFilters
                    }
                }
            };
        }

        case TracingActionTypes.SetSelectedElementsSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        selectedElements: action.payload.selectedElements
                    }
                }
            };

        case TracingActionTypes.SetSelectedStationsSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        selectedElements: {
                            ...state.fclData.graphSettings.selectedElements,
                            stations: action.payload.stationIds
                        }
                    }
                }
            };

        case TracingActionTypes.SetSelectedDeliveriesSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        selectedElements: {
                            ...state.fclData.graphSettings.selectedElements,
                            deliveries: action.payload.deliveryIds
                        }
                    }
                }
            };

        case TracingActionTypes.SetStationPositionsSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        stationPositions: action.payload.stationPositions
                    }
                }
            };
        case TracingActionTypes.SetStationPositionsAndLayoutSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        stationPositions: action.payload.stationPositions,
                        schemaLayout: action.payload.layout
                    }
                }
            };
        case TracingActionTypes.SetSchemaGraphLayoutSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        schemaLayout: action.payload.layout
                    }
                }
            };
        case TracingActionTypes.SetGisGraphLayoutSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        gisLayout: action.payload.layout
                    }
                }
            };
        case TracingActionTypes.SetStationGroupsSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    groupSettings: action.payload.groupSettings,
                    tracingSettings: {
                        ...state.fclData.tracingSettings,
                        stations: action.payload.stationTracingSettings
                    },
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        selectedElements: {
                            ...state.fclData.graphSettings.selectedElements,
                            stations: action.payload.selectedStations
                        },
                        highlightingSettings: {
                            ...state.fclData.graphSettings.highlightingSettings,
                            invisibleStations: action.payload.invisibleStations
                        },
                        stationPositions: action.payload.stationPositions
                    }
                }
            };

        case TracingActionTypes.SetStationHighlightingRulesSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        highlightingSettings: {
                            ...state.fclData.graphSettings.highlightingSettings,
                            stations: action.payload.rules
                        }
                    }
                }
            };

        case TracingActionTypes.SetStationHighlightingEditRulesSOA:
            return {
                ...state,
                highlightingConfigurationSettings: {
                    ...state.highlightingConfigurationSettings,
                    stationEditRules: action.payload.editRules
                }
            };

        case TracingActionTypes.SetDeliveryHighlightingRulesSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        highlightingSettings: {
                            ...state.fclData.graphSettings.highlightingSettings,
                            deliveries: action.payload.rules
                        }
                    }
                }
            };

        case TracingActionTypes.SetDeliveryHighlightingEditRulesSOA:
            return {
                ...state,
                highlightingConfigurationSettings: {
                    ...state.highlightingConfigurationSettings,
                    deliveryEditRules: action.payload.editRules
                }
            };

        case TracingActionTypes.SetTracingSettingsSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    tracingSettings: action.payload.tracingSettings
                }
            };

        case TracingActionTypes.SetCrossContTraceTypeSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    tracingSettings: {
                        ...state.fclData.tracingSettings,
                        crossContTraceType: action.payload.crossContTraceType
                    }
                }
            };

        case TracingActionTypes.SetHighlightingSettingsSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        highlightingSettings: action.payload.highlightingSettings
                    }
                }
            };

        case TracingActionTypes.SetInvisibleElementsSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        highlightingSettings: action.payload.highlightingSettings
                    },
                    tracingSettings: action.payload.tracingSettings
                }
            };

        case TracingActionTypes.SetGhostStationSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        ghostStation: action.payload.stationId,
                        ghostDelivery: null
                    }
                }
            };
        case TracingActionTypes.SetGhostDeliverySOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        ghostStation: null,
                        ghostDelivery: action.payload.deliveryId
                    }
                }
            };

        case TracingActionTypes.DeleteGhostElementSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        ghostStation: null,
                        ghostDelivery: null
                    }
                }
            };

        case TracingActionTypes.SetHoverDeliveriesSOA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        hoverDeliveries: action.payload.deliveryIds
                    }
                }
            };

        case TracingActionTypes.SetActiveConfigurationTabIdSOA:
            return {
                ...state,
                configurationTabIndices: {
                    ...state.configurationTabIndices,
                    activeConfigurationTabId: action.payload.activeConfigurationTabId
                },
                animatingTabCount: state.animatingTabCount + 1
            };

        case TracingActionTypes.SetActiveFilterTabIdSOA:
            return {
                ...state,
                configurationTabIndices: {
                    ...state.configurationTabIndices,
                    activeFilterTabId: action.payload.activeFilterTabId
                },
                animatingTabCount: state.animatingTabCount + 1
            };

        case TracingActionTypes.SetActiveHighlightingTabIdSOA:
            return {
                ...state,
                configurationTabIndices: {
                    ...state.configurationTabIndices,
                    activeHighlightingTabId: action.payload.activeHighlightingTabId
                }
            };

        case TracingActionTypes.SetROAReportSettingsSOA:
            return {
                ...state,
                roaSettings: action.payload.roaSettings
            };

        case TracingActionTypes.SetLastUnchangedJsonDataExtractSuccessSOA:
            return {
                ...state,
                lastUnchangedJsonDataExtract: action.payload.extractData
            };

        default:
            return state;
    }
}
