import { Injectable } from '@angular/core';
import {
    TableColumn,
    StationTable,
    SelectedElements,
    MakeElementsInvisibleInputState,
    SetInvisibleElementsPayload,
    HighlightingSettings,
    ClearInvisibilitiesOptions,
    SetHighlightingSettingsPayload,
    DataServiceInputState,
    StationData,
    StationId,
    OperationType} from '../data.model';
import { EditTracingSettingsService } from '../services/edit-tracing-settings.service';
import { TableService } from '../services/table.service';
import { Utils } from '../util/non-ui-utils';
import { ComplexFilterCondition, JunktorType } from './configuration.model';
import { StationEditRule } from './model';

@Injectable({
    providedIn: 'root'
})
export class EditHighlightingService {

    private static readonly hiddenStationProps = ['selected', 'invisible'];

    constructor(
        private tableService: TableService,
        private editTracSettingsService: EditTracingSettingsService
    ) {}

    getStationData(state: DataServiceInputState): StationTable {
        const dataTable = this.tableService.getStationData(state);

        return {
            ...dataTable,
            columns: this.filterStationColumns(dataTable.columns)
        };
    }

    private filterColumns(columns: TableColumn[], hiddenProps: string[]): TableColumn[] {
        return columns.filter(
            column => hiddenProps.indexOf(column.id) < 0
        );
    }

    private filterStationColumns(columns: TableColumn[]): TableColumn[] {
        return this.filterColumns(columns, EditHighlightingService.hiddenStationProps);
    }

    private getNewInvisibilities(oldInvIds: string[], updateInvIds: string[], invisible: boolean): string[] {
        if (updateInvIds.length === 0) {
            return oldInvIds;
        } else if (invisible) {
            return [].concat(oldInvIds, updateInvIds);
        } else {
            return Utils.getStringArrayDifference(oldInvIds, updateInvIds);
        }
    }

    getMakeElementsInvisiblePayload(
        state: MakeElementsInvisibleInputState,
        elements: SelectedElements
    ): SetInvisibleElementsPayload {

        const tracingSettings = this.editTracSettingsService.resetObservedTypeForElements(state.tracingSettings, elements);

        return {
            tracingSettings: tracingSettings,
            highlightingSettings: {
                ...state.highlightingSettings,
                invisibleStations: this.getNewInvisibilities(
                    state.highlightingSettings.invisibleStations,
                    elements.stations,
                    true
                ),
                invisibleDeliveries: this.getNewInvisibilities(
                    state.highlightingSettings.invisibleDeliveries,
                    elements.deliveries,
                    true
                )
            }
        };
    }

    getClearInvisiblitiesPayload(
        state: HighlightingSettings,
        options: ClearInvisibilitiesOptions
    ): SetHighlightingSettingsPayload {
        if (options.clearDeliveryInvs || options.clearStationInvs) {
            return {
                highlightingSettings: {
                    ...state,
                    invisibleStations: options.clearStationInvs ? [] : state.invisibleStations,
                    invisibleDeliveries: options.clearDeliveryInvs ? [] : state.invisibleDeliveries
                }
            };
        }
        return null;
    }

    addSelectionToStatRuleConditions<T extends StationEditRule>(editRule: T, stations: StationData[]): T {
        const listedIds = this.getListedIdsFromConditions(editRule.complexFilterConditions);
        const selectedIds = this.getSelectedStatIds(stations);
        const addIds = Utils.getStringArrayDifference(selectedIds, listedIds);
        if (addIds.length > 0) {
            const addConditions = this.createConditionsForIds(addIds);
            const index = this.getLastNonEmptyConditionIndex(editRule.complexFilterConditions);
            const newConditions = [].concat(
                editRule.complexFilterConditions.slice(0, index + 1),
                addConditions
            );
            return {
                ...editRule,
                complexFilterConditions: newConditions
            };
        }

    }

    removeSelectionFromStatRuleConditions<T extends StationEditRule>(editRule: T, stations: StationData[]): T {
        const selectedIds = this.getSelectedStatIds(stations);
        const newConditions = this.filterConditionsForIds(editRule.complexFilterConditions, selectedIds);
        if (newConditions.length < editRule.complexFilterConditions.length) {
            return {
                ...editRule,
                complexFilterConditions: newConditions
            };
        }
        return editRule;
    }

    private getListedIdsFromConditions(conditions: ComplexFilterCondition[]): string[] {
        return conditions.filter(c =>
            c.propertyName === 'id' && c.operationType === OperationType.EQUAL && c.value.length > 0
        ).map(c => c.value);
    }

    private getSelectedStatIds(stations: StationData[]): StationId[] {
        return stations.filter(s => !s.invisible && !s.contained && s.selected).map(s => s.id);
    }

    private getLastNonEmptyConditionIndex(conditions: ComplexFilterCondition[]): number {
        for (let i = conditions.length - 1; i >= 0; i--) {
            const condition = conditions[i];
            if (condition.value.length > 0 || condition.propertyName !== null) {
                return i;
            }
        }
        return -1;
    }

    private createConditionsForIds(ids: string[]): ComplexFilterCondition[] {
        return ids.map(id => ({
            propertyName: 'id',
            operationType: OperationType.EQUAL,
            value: id,
            junktorType: JunktorType.OR
        }));
    }

    private filterConditionsForIds(conditions: ComplexFilterCondition[], ids: string[]): ComplexFilterCondition[] {
        const idToDeleteMap = Utils.createSimpleStringSet(ids);
        return conditions.filter(c =>
            c.propertyName !== 'id' ||
            c.operationType !== OperationType.EQUAL ||
            !idToDeleteMap[c.value]
        );
    }
}
