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
        columnOrder: ['name', 'lot', 'date', 'source.name', 'target.name']
    }
};

const initialHighlightingConfigurationSettings: HighlightingConfigurationSettings = {
    colorsAndShapesSettings: {
        editIndex: null
    }
};

const initialModelDependentState: ModelDependentState = {
    visioReport: null,
    roaSettings: null,
    filterSettings: initialFilterSettings,
    highlightingConfigurationSettings: initialHighlightingConfigurationSettings
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
            fontSize: Constants.DEFAULT_GRAPH_FONT_SIZE,
            mergeDeliveriesType: MergeDeliveriesType.NO_MERGE,
            showMergedDeliveriesCounts: false,
            skipUnconnectedStations: Constants.DEFAULT_SKIP_UNCONNECTED_STATIONS,
            showLegend: Constants.DEFAULT_GRAPH_SHOW_LEGEND,
            showZoom: Constants.DEFAULT_GRAPH_SHOW_ZOOM,
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
        case TracingActionTypes.TracingActivated:
            return {
                ...state,
                tracingActive: action.payload.isActivated
            };

        case TracingActionTypes.LoadFclDataSuccess:
            action.payload.fclData.graphSettings.mapType = state.fclData.graphSettings.mapType;
            action.payload.fclData.graphSettings.shapeFileData = state.fclData.graphSettings.shapeFileData;

            return {
                ...state,
                fclData: action.payload.fclData,
                ...initialModelDependentState
            };

        case TracingActionTypes.LoadFclDataFailure:
            return {
                ...state,
                fclData: initialData
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
                showConfigurationSideBar: action.payload.showConfigurationSideBar
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
                        nodeSize: action.payload.nodeSize
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

        case TracingActionTypes.SetColorsAndShapesEditIndexSOA:
            return {
                ...state,
                highlightingConfigurationSettings: {
                    ...state.highlightingConfigurationSettings,
                    colorsAndShapesSettings: {
                        ...state.highlightingConfigurationSettings.colorsAndShapesSettings,
                        editIndex: action.payload.editIndex
                    }
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
                        highlightingSettings: action.payload.highlightingSettings,
                        selectedElements: action.payload.selectedElements
                    }
                }
            };

        case TracingActionTypes.ShowGhostStationMSA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        ghostStation: action.payload.stationId
                    }
                }
            };

        case TracingActionTypes.ClearGhostStationMSA:
            return {
                ...state,
                fclData: {
                    ...state.fclData,
                    graphSettings: {
                        ...state.fclData.graphSettings,
                        ghostStation: null
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
                }
            };

        case TracingActionTypes.SetActiveFilterTabIdSOA:
            return {
                ...state,
                configurationTabIndices: {
                    ...state.configurationTabIndices,
                    activeFilterTabId: action.payload.activeFilterTabId
                }
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

        default:
            return state;
    }
}
