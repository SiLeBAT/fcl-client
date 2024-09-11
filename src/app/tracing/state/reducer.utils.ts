import { FilterTableSettings } from "../configuration/configuration.model";
import { TracingState } from "../state.model";
import { Constants } from "../util/constants";

export function isAnoRuleActive(state: TracingState): boolean {
    return state.fclData.graphSettings.highlightingSettings.stations.some(
        (r) => !r.userDisabled && !!r.labelParts,
    );
}

export function isStatFilterTabActive(state: TracingState): boolean {
    return (
        state.showConfigurationSideBar &&
        state.configurationTabIndices.activeConfigurationTabId ===
            "filterTab" &&
        state.configurationTabIndices.activeFilterTabId === "stationsTab"
    );
}

export function updateColumnFilters<T extends FilterTableSettings>(
    filterTableSettings: T,
): T {
    const oldColumnFilters = filterTableSettings.columnFilters;
    const colSet = new Set(filterTableSettings.columnOrder);
    const newColumnFilters = oldColumnFilters.filter((f) =>
        colSet.has(f.filterProp),
    );
    if (oldColumnFilters.length !== newColumnFilters.length) {
        filterTableSettings = {
            ...filterTableSettings,
            columnFilters: newColumnFilters,
        };
    }
    return filterTableSettings;
}

export function updateStationAutoColumnSettings(
    state: TracingState,
): TracingState {
    const anoIsActive = isAnoRuleActive(state);
    let stationFilter = state.filterSettings.stationFilter;

    if (anoIsActive) {
        if (
            stationFilter.lastActiveAnoColumnOrder !== stationFilter.columnOrder
        ) {
            stationFilter = {
                ...stationFilter,
                lastActiveAnoColumnOrder: stationFilter.columnOrder,
            };
        }
    } else {
        if (
            stationFilter.lastInactiveAnoColumnOrder !==
            stationFilter.columnOrder
        ) {
            stationFilter = {
                ...stationFilter,
                lastInactiveAnoColumnOrder: stationFilter.columnOrder,
            };
        }
    }
    if (stationFilter !== state.filterSettings.stationFilter) {
        state = {
            ...state,
            filterSettings: {
                ...state.filterSettings,
                stationFilter: stationFilter,
            },
        };
    }

    return state;
}

function getAnoColumnIndex(arr: string[]): number {
    return arr.findIndex((x) => x === Constants.COLUMN_ANONYMIZED_NAME);
}

function getNameColumnIndex(arr: string[]): number {
    return arr.findIndex((x) => x === Constants.COLUMN_NAME);
}

export function updateStationAutoColumns(state: TracingState): TracingState {
    const anoIsActive = isAnoRuleActive(state);

    let columnOrder = state.filterSettings.stationFilter.columnOrder;
    const anoColIndex = getAnoColumnIndex(columnOrder);
    if (anoIsActive) {
        if (anoColIndex < 0) {
            // ano col is not present
            const lastActiveAnoColumnOrder =
                state.filterSettings.stationFilter.lastActiveAnoColumnOrder;
            const wasAnoColPresent = lastActiveAnoColumnOrder
                ? getAnoColumnIndex(lastActiveAnoColumnOrder) >= 0
                : undefined;
            if (wasAnoColPresent === false) {
                // do nothing ano col is not welcome
            } else {
                const nameColIndex = getNameColumnIndex(columnOrder);
                if (nameColIndex < 0) {
                    // do nothing, because name col is not present
                } else {
                    if (wasAnoColPresent === undefined) {
                        // first activation with active ano
                        // default replace name with ano col
                        columnOrder = columnOrder.slice();
                        columnOrder[nameColIndex] =
                            Constants.COLUMN_ANONYMIZED_NAME;
                    } else {
                        const wasNameColPresent =
                            lastActiveAnoColumnOrder!.includes(
                                Constants.COLUMN_NAME,
                            );
                        if (wasNameColPresent) {
                            // add ano column
                            columnOrder = [
                                ...columnOrder.slice(0, nameColIndex),
                                Constants.COLUMN_ANONYMIZED_NAME,
                                ...columnOrder.slice(nameColIndex),
                            ];
                        } else {
                            // replace name with ano column
                            columnOrder = columnOrder.slice();
                            columnOrder[nameColIndex] =
                                Constants.COLUMN_ANONYMIZED_NAME;
                        }
                    }
                }
            }
        }
    } else {
        // ano is inactive
        if (anoColIndex >= 0) {
            // ano col is present
            const lastInactiveAnoColumnOrder =
                state.filterSettings.stationFilter.lastInactiveAnoColumnOrder;
            // const nameColIndex = lastActiveAnoColumnOrder ? getNameColumnIndex(lastActiveAnoColumnOrder) : -1;
            const wasAnoColPresent = lastInactiveAnoColumnOrder
                ? getAnoColumnIndex(lastInactiveAnoColumnOrder) >= 0
                : undefined;
            if (wasAnoColPresent === true) {
                // do nothing ano col shall stay
            } else {
                // const isNameColPresent = getNameColumnIndex(columnOrder) >= 0;
                const nameColIndex = getNameColumnIndex(columnOrder);
                columnOrder = columnOrder.slice();
                if (nameColIndex >= 0) {
                    columnOrder.splice(anoColIndex, 1);
                } else {
                    columnOrder[anoColIndex] = Constants.COLUMN_NAME;
                }
            }
        }
    }

    if (columnOrder !== state.filterSettings.stationFilter.columnOrder) {
        let stationFilter = {
            ...state.filterSettings.stationFilter,
            columnOrder: columnOrder,
            wasAnoActiveOnLastColumnSet: anoIsActive,
        };
        if (anoIsActive) {
            stationFilter.lastActiveAnoColumnOrder = columnOrder;
        } else {
            stationFilter.lastInactiveAnoColumnOrder = columnOrder;
        }

        stationFilter = updateColumnFilters(stationFilter);

        state = {
            ...state,
            filterSettings: {
                ...state.filterSettings,
                stationFilter: stationFilter,
            },
        };
    }

    return state;
}

export function updateStationAutoColumnsIfRequired(
    state: TracingState,
): TracingState {
    const anoIsActive = isAnoRuleActive(state);
    if (
        isStatFilterTabActive(state) &&
        state.filterSettings.stationFilter.wasAnoActiveOnLastColumnSet !==
            anoIsActive
    ) {
        state = updateStationAutoColumns(state);
    }

    return state;
}
