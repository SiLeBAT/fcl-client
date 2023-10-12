import { AnonymizedNameColumnMode } from '../configuration/configuration.model';
import { HighlightingRule } from '../data.model';
import { TracingState } from '../state.model';
import { Constants } from '../util/constants';
import { Utils } from '../util/non-ui-utils';

export function isAnoRuleActive(hRules: HighlightingRule[]): boolean {
    return hRules.some(r => !r.userDisabled && !!r.labelParts);
}

export function addStatAnoColumnOnAnoActivation(oldHRules: HighlightingRule[], newState: TracingState): TracingState {
    const anoColumnMode = newState.filterSettings.stationFilter.anonymizedNameColumnMode;
    const newAnoIsActive = isAnoRuleActive(newState.fclData.graphSettings.highlightingSettings.stations);

    if (
        newAnoIsActive &&
        anoColumnMode !== AnonymizedNameColumnMode.DO_NOT_AUTO_SHOW &&
        !isAnoRuleActive(oldHRules)
    ) {
        let columnOrder = newState.filterSettings.stationFilter.columnOrder;
        const anoColIndex = columnOrder.findIndex(c => c === Constants.COLUMN_ANONYMIZED_NAME);
        if (anoColIndex < 0) {
            const oldNameColIndex = columnOrder.findIndex(c => c === Constants.COLUMN_NAME);
            if (oldNameColIndex >= 0) {
                if (anoColumnMode === AnonymizedNameColumnMode.ADD) {
                    columnOrder = Utils.insertInOrder(
                        columnOrder,
                        Constants.FAVOURITE_STAT_COLUMNS_INCL_ANO.toArray().map(c => c.id),
                        [Constants.COLUMN_ANONYMIZED_NAME]
                    );
                } else {
                    columnOrder = columnOrder.slice();
                    columnOrder[oldNameColIndex] = Constants.COLUMN_ANONYMIZED_NAME;
                }
                newState = {
                    ...newState,
                    filterSettings: {
                        ...newState.filterSettings,
                        stationFilter: {
                            ...newState.filterSettings.stationFilter,
                            columnOrder: columnOrder
                        }
                    }
                };
            }
        }
    }

    return newState;
}

export function updateStatAnoColumnModeOnAnoDeactivation(oldHRules: HighlightingRule[], newState: TracingState): TracingState {
    const newAnoIsActive = isAnoRuleActive(newState.fclData.graphSettings.highlightingSettings.stations);
    if (
        !newAnoIsActive &&
        isAnoRuleActive(oldHRules)
    ) {
        const oldAnoColumnMode = newState.filterSettings.stationFilter.anonymizedNameColumnMode;
        const columnOrder = newState.filterSettings.stationFilter.columnOrder;
        const anoColIndex = columnOrder.findIndex(c => c === Constants.COLUMN_ANONYMIZED_NAME);
        let newAnoColumnMode = oldAnoColumnMode;
        if (anoColIndex < 0) {
            newAnoColumnMode = AnonymizedNameColumnMode.DO_NOT_AUTO_SHOW;
        } else {
            newAnoColumnMode = columnOrder.includes(Constants.COLUMN_NAME) ?
                AnonymizedNameColumnMode.ADD :
                AnonymizedNameColumnMode.REPLACE_NAME_COLUMN;
        }
        if (newAnoColumnMode !== oldAnoColumnMode) {
            newState = {
                ...newState,
                filterSettings: {
                    ...newState.filterSettings,
                    stationFilter: {
                        ...newState.filterSettings.stationFilter,
                        anonymizedNameColumnMode: newAnoColumnMode
                    }
                }
            };
        }
    }
    return newState;
}

export function isStatFilterTabActive(state: TracingState): boolean {
    return (
        state.showConfigurationSideBar &&
        state.configurationTabIndices.activeConfigurationTabId === 'filterTab' &&
        state.configurationTabIndices.activeFilterTabId === 'stationsTab'
    );
}

export function removeAnoRefsOnStatFilterActivitationWoAno(oldState: TracingState, newState: TracingState): TracingState {
    if (
        isStatFilterTabActive(newState) &&
        !isStatFilterTabActive(oldState) &&
        !isAnoRuleActive(newState.fclData.graphSettings.highlightingSettings.stations)
    ) {
        let newStatFilterSettings = newState.filterSettings.stationFilter;
        const anoColIndex = newStatFilterSettings.columnOrder.indexOf(Constants.COLUMN_ANONYMIZED_NAME);
        if (anoColIndex >= 0) {
            const nameColIndex = newStatFilterSettings.columnOrder.indexOf(Constants.COLUMN_NAME);
            const newColumnOrder = newStatFilterSettings.columnOrder.slice();
            if (nameColIndex > 0) {
                newColumnOrder.splice(anoColIndex, 1);
            } else {
                newColumnOrder[anoColIndex] = Constants.COLUMN_NAME;
            }
            newStatFilterSettings = {
                ...newStatFilterSettings,
                columnOrder: newColumnOrder
            };
        }
        if (newStatFilterSettings.complexFilter.conditions.some(
            c => c.propertyName === Constants.COLUMN_ANONYMIZED_NAME
        )) {
            newStatFilterSettings = {
                ...newStatFilterSettings,
                complexFilter: {
                    ...newStatFilterSettings.complexFilter,
                    conditions: newStatFilterSettings.complexFilter.conditions.map(
                        c => (
                            c.propertyName === Constants.COLUMN_ANONYMIZED_NAME ?
                                { ...c, propertyName: null } :
                                c
                        )
                    )
                }
            };
        }
        if (newStatFilterSettings.columnFilters.some(
            c => c.filterProp === Constants.COLUMN_ANONYMIZED_NAME
        )) {
            newStatFilterSettings = {
                ...newStatFilterSettings,
                columnFilters: newStatFilterSettings.columnFilters.filter(
                    c => c.filterProp !== Constants.COLUMN_ANONYMIZED_NAME
                )
            };
        }
        if (newStatFilterSettings !== newState.filterSettings.stationFilter) {
            newState = {
                ...newState,
                filterSettings: {
                    ...newState.filterSettings,
                    stationFilter: newStatFilterSettings
                }
            };
        }
    }
    return newState;
}
