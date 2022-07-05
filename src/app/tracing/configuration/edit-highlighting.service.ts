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
    OperationType,
    DeliveryHighlightingRule,
    DeliveryId,
    HighlightingRule,
    StationHighlightingRule} from '../data.model';
import { DataService } from '../services/data.service';
import { EditTracingSettingsService } from '../services/edit-tracing-settings.service';
import { TableService } from '../services/table.service';
import { Utils } from '../util/non-ui-utils';
import { ComplexFilterCondition, JunktorType, PropToValuesMap } from './configuration.model';
import { EditRuleCreator } from './edit-rule-creator';
import {
    ColorAndShapeEditRule, ColorEditRule, DeliveryEditRule, DeliveryRuleType, EditHighlightingServiceData,
    EditRule, InvEditRule, LabelEditRule, RuleId, RuleListItem, RuleType, StationEditRule,
    StationRuleType
} from './model';
import {
    convertDeliveryEditRuleToHRule, convertDeliveryHRuleToEditRule, convertDeliveryHRuleToRuleListItem,
    convertStationHRuleToRuleListItem, convertStationEditRuleToHRule, convertStationHRuleToEditRule
} from './rule-conversion';
import { extractPropToValuesMap } from './shared';

type TypeOfEditRule<T extends RuleType> =
    T extends RuleType.LABEL ? LabelEditRule :
    T extends RuleType.COLOR_AND_SHAPE ? ColorAndShapeEditRule :
    T extends RuleType.COLOR ? ColorEditRule :
    T extends RuleType.INVISIBILITY ? InvEditRule : never;

interface UnsharedData {
    propData: PropData;
    ruleListItems: RuleListItem[];
}

interface PropData {
    availableProperties: TableColumn[];
    propToValuesMap: PropToValuesMap;
    favoriteColumnsLength: number;
}

interface CachedData {
    stationSpecificData: UnsharedData;
    deliverySpecificData: UnsharedData;
    // eslint-disable-next-line @typescript-eslint/ban-types
    highlightingStats: {};
    // eslint-disable-next-line @typescript-eslint/ban-types
    tracingPropsUpdatedFlag: {};
}

@Injectable({
    providedIn: 'root'
})
export class EditHighlightingService {

    private static readonly hiddenProps = ['selected', 'invisible'];
    private static readonly hiddenDeliveryProps = EditHighlightingService.hiddenProps;
    private static readonly hiddenStationProps = EditHighlightingService.hiddenProps;

    private cachedData: CachedData | null = null;

    constructor(
        private tableService: TableService,
        private dataService: DataService,
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

    private filterDeliveryColumns(columns: TableColumn[]): TableColumn[] {
        return this.filterColumns(columns, EditHighlightingService.hiddenDeliveryProps);
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

    applyRuleOrderChange<T extends HighlightingRule>(ruleIds: RuleId[], rules: T[]): T[] {
        const newRules = rules.slice();
        let oldIndices = ruleIds.map(id => rules.findIndex(r => r.id === id));
        oldIndices = oldIndices.filter(i => i >= 0);
        let newIndices = oldIndices.slice();
        newIndices = newIndices.sort((i1, i2) => i1 - i2);
        oldIndices.forEach((oldIndex, index) => {
            const newIndex = newIndices[index];
            newRules[newIndex] = rules[oldIndex];
        });
        return newRules;
    }

    toggleRuleIsDisabled<T extends HighlightingRule>(ruleId: RuleId, rules: T[]): T[] {
        const rule = this.getRuleFromId(ruleId, rules);
        if (rule !== null) {
            rules = this.updateRule(rule, { disabled: !rule.disabled }, rules);
        }
        return rules;
    }

    toggleShowRuleInLegend<T extends HighlightingRule>(ruleId: RuleId, rules: T[]): T[] {
        const rule = this.getRuleFromId(ruleId, rules);
        if (rule !== null) {
            rules = this.updateRule(rule, { showInLegend: !rule.showInLegend }, rules);
        }
        return rules;
    }

    private updateRule<T extends HighlightingRule>(rule: T, update: Partial<HighlightingRule>, rules: T[]): T[] {
        if (rule !== null) {
            const newRule: T = {
                ...rule,
                ...update
            };
            return this.applyRule(newRule, rules);
        }
        return rules;
    }

    // addSelectionToStatRuleConditions<T extends StationEditRule>(editRule: T, stations: StationData[]): T {
    //     const selectedIds = this.getSelectedStatIds(stations);
    //     return this.addSelectionToRuleConditions(editRule, selectedIds);
    // }

    addSelectionToStationRuleConditions<T extends StationEditRule>(editRule: T, state: DataServiceInputState): T {
        const selectedIds = this.getSelectedStationIdsFromState(state);
        return this.addSelectionToRuleConditions(editRule, selectedIds);
    }

    addSelectionToDeliveryRuleConditions<T extends DeliveryEditRule>(editRule: T, state: DataServiceInputState): T {
        const selectedIds = this.getSelectedDeliveryIdsFromState(state);
        return this.addSelectionToRuleConditions(editRule, selectedIds);
    }

    private addSelectionToRuleConditions<T extends EditRule>(editRule: T, selectedIds: string[]): T {
        const listedIds = this.getListedIdsFromConditions(editRule.complexFilterConditions);
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
        return editRule;
    }

    removeSelectionFromStationRuleConditions<T extends StationEditRule>(editRule: T, state: DataServiceInputState): T {
        const selectedIds = this.getSelectedStationIdsFromState(state);
        return this.removeSelectionFromEditRuleConditions(editRule, selectedIds);
    }

    removeSelectionFromDeliveryRuleConditions<T extends DeliveryEditRule>(editRule: T, state: DataServiceInputState): T {
        const selectedIds = this.getSelectedDeliveryIdsFromState(state);
        return this.removeSelectionFromEditRuleConditions(editRule, selectedIds);
    }

    private removeSelectionFromEditRuleConditions<T extends EditRule>(editRule: T, selectedIds: string[]): T {
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

    private getSelectedStationIdsFromState(state: DataServiceInputState): StationId[] {
        const stations = this.dataService.getData(state).stations;
        return stations.filter(s => !s.invisible && !s.contained && s.selected).map(s => s.id);
    }

    private getSelectedDeliveryIdsFromState(state: DataServiceInputState): DeliveryId[] {
        const deliveries = this.dataService.getData(state).deliveries;
        return deliveries.filter(d => !d.invisible && d.selected).map(d => d.id);
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

    createEditRuleFromStationRule(
        ruleId: RuleId, rules: StationHighlightingRule[]
    ): StationEditRule | null {
        const rule = this.getRuleFromId(ruleId, rules);
        return rule === null ? null : convertStationHRuleToEditRule(rule);
    }

    createEditRuleFromDeliveryRule(
        ruleId: RuleId, rules: DeliveryHighlightingRule[]
    ): DeliveryEditRule | null {
        const rule = this.getRuleFromId(ruleId, rules);
        return rule === null ? null : convertDeliveryHRuleToEditRule(rule);
    }

    private getRuleFromId<T extends HighlightingRule | EditRule>(ruleId: RuleId, rules: T[]): T | null {
        const ruleIndex = rules.findIndex(r => r.id === ruleId);
        return ruleIndex >= 0 ? rules[ruleIndex] : null;
    }

    createEditRuleFromRuleType<
        T extends StationRuleType | DeliveryRuleType,
        R extends TypeOfEditRule<T>
    >(
        ruleType: RuleType
    ): R | null {
        switch (ruleType) {
            case RuleType.LABEL:
                return EditRuleCreator.createLabelEditRule() as R;
            case RuleType.COLOR_AND_SHAPE:
                return EditRuleCreator.createColorAndShapeEditRule() as R;
            case RuleType.COLOR:
                return EditRuleCreator.createColorEditRule() as R;
            case RuleType.INVISIBILITY:
                return EditRuleCreator.createInvEditRule() as R;
            default:
                return null;
        }
    }

    applyDeliveryRule(editRule: DeliveryEditRule, rules: DeliveryHighlightingRule[]): DeliveryHighlightingRule[] {
        const rule = convertDeliveryEditRuleToHRule(editRule);
        return this.applyRule(rule, rules);
    }

    applyStationRule(editRule: StationEditRule, rules: StationHighlightingRule[]): StationHighlightingRule[] {
        const rule = convertStationEditRuleToHRule(editRule);
        return this.applyRule(rule, rules);
    }

    applyRule<T extends EditRule | HighlightingRule >(rule: T, rules: T[]): T[] {
        const newRules = rules.slice();
        const ruleIndex = rules.findIndex(r => r.id === rule.id);
        if (ruleIndex >= 0) {
            newRules[ruleIndex] = rule;
        } else {
            newRules.push(rule);
        }
        return newRules;
    }

    removeRule<T extends EditRule | HighlightingRule>(rules: T[], ruleId: RuleId): T[] {
        return rules.filter(r => r.id !== ruleId);
    }

    getDataForEditStationHighlightingRules(
        state: DataServiceInputState
    ): EditHighlightingServiceData {

        this.updateCache(state);

        return {
            ...this.cachedData.stationSpecificData.propData,
            ruleListItems: this.cachedData.stationSpecificData.ruleListItems
        };
    }

    getDataForEditDeliveryHighlightingRules(
        state: DataServiceInputState
    ): EditHighlightingServiceData {

        this.updateCache(state);

        return {
            ...this.cachedData.deliverySpecificData.propData,
            ruleListItems: this.cachedData.deliverySpecificData.ruleListItems
        };
    }

    private updateCache(state: DataServiceInputState): void {
        const dataServiceData = this.dataService.getData(state);
        const cacheIsEmpty = this.cachedData === null;

        let deliveryRuleListItems = cacheIsEmpty ? null : this.cachedData.deliverySpecificData.ruleListItems;
        let stationRuleListItems = cacheIsEmpty ? null : this.cachedData.stationSpecificData.ruleListItems;
        let deliveryPropData = cacheIsEmpty ? null : this.cachedData.deliverySpecificData.propData;
        let stationPropData = cacheIsEmpty ? null : this.cachedData.stationSpecificData.propData;

        if (cacheIsEmpty || this.cachedData.highlightingStats !== dataServiceData.highlightingStats) {
            // update rule lists
            deliveryRuleListItems = state.highlightingSettings.deliveries.map(
                rule => convertDeliveryHRuleToRuleListItem(rule, dataServiceData.highlightingStats)
            );
            stationRuleListItems = state.highlightingSettings.stations.map(
                rule => convertStationHRuleToRuleListItem(rule, dataServiceData.highlightingStats)
            );
        }

        if (cacheIsEmpty || this.cachedData.tracingPropsUpdatedFlag !== dataServiceData.tracingPropsUpdatedFlag) {
            // create propToValuesFlag
            deliveryPropData = this.createDeliveryPropData(state);
            stationPropData = this.createStationPropData(state);
        }
        this.cachedData = {
            deliverySpecificData: {
                propData: deliveryPropData,
                ruleListItems: deliveryRuleListItems
            },
            stationSpecificData: {
                propData: stationPropData,
                ruleListItems: stationRuleListItems
            },
            highlightingStats: dataServiceData.highlightingStats,
            tracingPropsUpdatedFlag: dataServiceData.tracingPropsUpdatedFlag
        };
    }

    private createDeliveryPropData(state: DataServiceInputState): PropData {
        const dataTable = this.tableService.getDeliveryData(state, false);
        const columns = this.filterDeliveryColumns(dataTable.columns);
        const favoriteDeliveryColumnLength = this.tableService.favoriteDeliveryColumnsLength;
        return {
            availableProperties: columns,
            propToValuesMap: extractPropToValuesMap(dataTable.rows, columns),
            favoriteColumnsLength: favoriteDeliveryColumnLength
        };
    }

    private createStationPropData(state: DataServiceInputState): PropData {
        const dataTable = this.tableService.getStationData(state);
        const columns = this.filterStationColumns(dataTable.columns);
        const favoriteStationColumnLength = this.tableService.favoriteStationColumnsLength;
        return {
            availableProperties: columns,
            propToValuesMap: extractPropToValuesMap(dataTable.rows, columns),
            favoriteColumnsLength: favoriteStationColumnLength
        };
    }
}
