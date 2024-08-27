import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { createPreprocessedConditions } from '../configuration/complex-row-filter-provider';
import {
    DataServiceData,
    StationData,
    StationHighlightingInfo,
    DeliveryHighlightingInfo,
    DeliveryData,
    Color,
    StationHighlightingRule,
    DeliveryHighlightingRule,
    HighlightingRule,
    OperationType,
    DataServiceInputState,
    HighlightingStats,
    LabelPart,
    LegendDisplayEntry
} from '../data.model';
import { removeNullish, Utils } from '../util/non-ui-utils';

type PropertyValueType = (number | string | boolean);
type RuleId = string;
type StationOrDeliveryData = StationData | DeliveryData;
type RuleConditionsEvaluatorFun = (element: StationOrDeliveryData) => boolean;

@Injectable({
    providedIn: 'root'
})
export class HighlightingService {

    static readonly DEFAULT_DELIVERY_COLOR: Color = { r: 0, g: 0, b: 0 };

    private statHighlightingRules: StationHighlightingRule[] = [];
    private delHighlightingRules: DeliveryHighlightingRule[] = [];

    private enabledStatHRules: StationHighlightingRule[] = [];
    private enabledDelHRules: DeliveryHighlightingRule[] = [];

    private ruleIdToEvaluatorFunMap: Record<RuleId, RuleConditionsEvaluatorFun> = {};
    private statRuleIdToEvaluatorFunMap: Record<RuleId, RuleConditionsEvaluatorFun> = {};
    private delRuleIdToEvaluatorFunMap: Record<RuleId, RuleConditionsEvaluatorFun> = {};

    applyVisibilities(state: DataServiceInputState, data: DataServiceData) {

        data.stations.forEach(s => {
            s.invisible = false;
            s.expInvisible = false;
        });
        data.deliveries.forEach(d => {
            d.invisible = false;
            d.expInvisible = false;
        });
        // ToDo: Refactor, check why a s!==null comparison is used here
        data.getStatById(state.highlightingSettings.invisibleStations)
            .filter(s => s !== null)
            .forEach(s => {
                s.invisible = true;
                s.expInvisible = true;
            });

        const newStatVis = Utils.createSimpleStringSet(data.stations.filter(s => !s.invisible).map(s => s.id));
        data.getDelById(state.highlightingSettings.invisibleDeliveries)
            .forEach(d => {
                d.invisible = true;
                d.expInvisible = true;
            });
        data.deliveries.filter(d => !d.invisible).forEach(
            d => d.invisible = data.statMap[d.source].invisible || data.statMap[d.target].invisible
        );
        const newDelVis = Utils.createSimpleStringSet(data.deliveries.filter(d => !d.invisible).map(d => d.id));

        if (!_.isEqual(data.delVis, newDelVis)) {
            data.delVis = newDelVis;
        }
        if (!_.isEqual(data.statVis, newStatVis)) {
            data.statVis = newStatVis;
        }
    }

    hasStationVisibilityChanged(oldState: DataServiceInputState, newState: DataServiceInputState): boolean {
        return !oldState || oldState.highlightingSettings.invisibleStations !== newState.highlightingSettings.invisibleStations;
    }

    hasDeliveryVisibilityChanged(oldState: DataServiceInputState, newState: DataServiceInputState): boolean {
        return !oldState || oldState.highlightingSettings.invisibleDeliveries !== newState.highlightingSettings.invisibleDeliveries;
    }

    private getEvaluatorFunFromRule(rule: HighlightingRule): RuleConditionsEvaluatorFun {

        if (rule.logicalConditions === null) {
            return (item: StationOrDeliveryData) => true;
        } else {
            const ppConditionGroups = createPreprocessedConditions(rule.logicalConditions);
            return (item: StationOrDeliveryData) => ppConditionGroups.some(
                ppConditionGroup => ppConditionGroup.every(
                    ppCondition => ppCondition.isValid(this.getPropertyValueFromElement(item, ppCondition.property))
                )
            );
        }
    }

    private getEnabledRules<T extends HighlightingRule>(rules: T[]): T[] {
        return rules.filter(r => !r.userDisabled && !r.autoDisabled);
    }

    private preprocessHighlightings(state: DataServiceInputState): void {
        const statRulesChanged = state.highlightingSettings.stations !== this.statHighlightingRules;
        const delRulesChanged = state.highlightingSettings.deliveries !== this.delHighlightingRules;
        if (statRulesChanged) {
            this.statHighlightingRules = state.highlightingSettings.stations;
            this.enabledStatHRules = this.getEnabledRules(this.statHighlightingRules);
            this.statRuleIdToEvaluatorFunMap = {};
            this.enabledStatHRules.forEach(
                rule => this.statRuleIdToEvaluatorFunMap[rule.id] = this.getEvaluatorFunFromRule(rule)
            );
        }
        if (delRulesChanged) {
            this.delHighlightingRules = state.highlightingSettings.deliveries;
            this.enabledDelHRules = this.getEnabledRules(this.delHighlightingRules);
            this.delRuleIdToEvaluatorFunMap = {};
            this.enabledDelHRules.forEach(
                rule => this.delRuleIdToEvaluatorFunMap[rule.id] = this.getEvaluatorFunFromRule(rule)
            );
        }
        if (statRulesChanged || delRulesChanged) {
            this.ruleIdToEvaluatorFunMap = {
                ...this.statRuleIdToEvaluatorFunMap,
                ...this.delRuleIdToEvaluatorFunMap
            };
        }
    }

    applyHighlightingProps(state: DataServiceInputState, data: DataServiceData): void {
        this.preprocessHighlightings(state);

        const effElementsStats: HighlightingStats = {
            counts: {},
            conflicts: {}
        };

        data.stations
            .filter((station: StationData) => !station.contained)
            .forEach((station: StationData) => {

                station.highlightingInfo = this.createStationHighlightingInfo(
                    station, state, effElementsStats
                );

            });

        data.deliveries
            .forEach((delivery: DeliveryData) => {

                delivery.highlightingInfo = this.createDeliveryHightlightingInfo(delivery, state, effElementsStats);

            });

        data.isStationAnonymizationActive = this.anonymizeStationsIfApplicable(data.stations, this.enabledStatHRules, effElementsStats);

        data.legendInfo = this.getLegendInfo({
            stations: this.getRuleIdToIsActiveMap(
                this.enabledStatHRules,
                effElementsStats
            ),
            deliveries: this.getRuleIdToIsActiveMap(
                this.enabledDelHRules,
                effElementsStats
            )
        });
        data.highlightingStats = effElementsStats;
    }

    private getRuleIdToIsActiveMap(hrules: HighlightingRule[], effElementsStats: HighlightingStats): Record<RuleId, boolean> {
        const result: Record<RuleId, boolean> = {};
        hrules.forEach(rule => result[rule.id] = (effElementsStats.counts[rule.id] || 0) > 0);
        return result;
    }

    private deliveryRuleToDisplayEntry(rule: DeliveryHighlightingRule): LegendDisplayEntry {
        return {
            name: rule.name,
            deliveryColor: this.mapToColor(rule.color),
            stationColor: null,
            shape: null

        };
    }

    private stationRuleToDisplayEntry(rule: StationHighlightingRule): LegendDisplayEntry {
        return {
            name: rule.name,
            deliveryColor: null,
            stationColor: this.mapToColor(rule.color),
            shape: rule.shape

        };
    }

    private getLegendInfo(
        activeHighlightings: { stations: Record<RuleId, boolean>; deliveries: Record<RuleId, boolean> }
    ): LegendDisplayEntry[] {

        const stationRulesToDisplay = this.enabledStatHRules.filter(rule =>
            rule.showInLegend &&
            (activeHighlightings.stations[rule.id] || this.isCommonLinkRule(rule))
        );
        const deliveryRulesToDisplay = this.enabledDelHRules.filter(rule =>
            rule.showInLegend && (activeHighlightings.deliveries[rule.id])
        );

        return this.statHighlightingRules
            .map(rule => this.stationRuleToDisplayEntry(rule))
            .concat(this.delHighlightingRules
                .map(rule => this.deliveryRuleToDisplayEntry(rule))
            )
            .reduce(
                (array: LegendDisplayEntry[], current) => {
                    const index = array.findIndex((entry) => entry.name === current.name);
                    if (index >= 0) {
                        //Should use legend.with(index,{newObj}) once we update to a newer TS version.
                        const newArray = array;
                        newArray[index] = {
                            name: current.name,
                            stationColor: array[index]?.stationColor ?? current?.stationColor,
                            deliveryColor: array[index]?.deliveryColor ?? current?.deliveryColor,
                            shape: array[index]?.shape ?? current?.shape
                        };
                        return newArray;
                    } else {
                        return [...array,
                            {
                                name: current.name,
                                stationColor: array[index]?.stationColor ?? current?.stationColor,
                                deliveryColor: array[index]?.deliveryColor ?? current?.deliveryColor,
                                shape: array[index]?.shape ?? current?.shape
                            }
                        ];
                    }
                },
                []
            )
            .map(rule => stationRulesToDisplay.some(enabledRule => enabledRule.name === rule.name)
                ? rule
                : { ...rule, stationColor: undefined, shape: undefined }

            )
            .map(rule => deliveryRulesToDisplay.some(enabledRule => enabledRule.name === rule.name)
                ? rule
                : { ...rule, deliveryColor: undefined }
            )
            .filter(rule => rule.deliveryColor || rule.shape || rule.stationColor);
    }


    private mapToColor(color: number[] | null): Color | null {
        return (color && color.length === 3) ? { r: color[0], g: color[1], b: color[2] } : null;
    }

    private isCommonLinkRule(rule: HighlightingRule): boolean {
        if (
            !rule.invisible &&
            rule.showInLegend &&
            rule.logicalConditions &&
            rule.logicalConditions.length === 1 &&
            rule.logicalConditions[0].length === 1
        ) {
            const logicalCondition = rule.logicalConditions[0][0];
            return (
                logicalCondition.propertyName === 'score' &&
                logicalCondition.operationType === OperationType.EQUAL &&
                logicalCondition.value === '1'
            );
        }
        return false;
    }

    private getActiveHighlightingRules<
        T extends StationOrDeliveryData,
        K extends(T extends StationData ? StationHighlightingRule : DeliveryHighlightingRule)
    >(fclElement: T, highlightingRules: K[]): K[] {
        return highlightingRules.filter(rule =>
            !rule.invisible &&
            (
                !rule.logicalConditions ||
                this.ruleIdToEvaluatorFunMap[rule.id](fclElement)
            )
        );
    }

    private anonymizeStationsIfApplicable<T extends StationData[]>(
        elements: StationData[],
        rules: HighlightingRule[],
        effElementsStats: HighlightingStats
    ): boolean {
        const anoRules = rules.filter(r => r.labelParts);

        elements.forEach(e => delete e.anonymizedName);

        for (const anoRule of anoRules) {
            const conditionsEvalFun = !anoRule.logicalConditions ? undefined : this.ruleIdToEvaluatorFunMap[anoRule.id];
            const indexedElements = elements;

            effElementsStats[anoRule.id] = indexedElements.length;

            const indexPartIndex = anoRule.labelParts!.findIndex(p => p.useIndex);
            if (indexPartIndex >= 0) {
                const preIndexParts = anoRule.labelParts!.slice(0, indexPartIndex);
                const afterIndexParts = anoRule.labelParts!.slice(indexPartIndex + 1);
                const prefixCount: Record<string, number> = {};
                const prefix2Elements: Record<string, T[0][]> = {};
                const prefixes: string[] = [];

                indexedElements.forEach((element: T[0]) => {
                    const prefix = this.getComposedLabel(element, preIndexParts);
                    const oldCount = prefixCount[prefix];
                    if (oldCount === undefined) {
                        prefixCount[prefix] = 1;
                        prefix2Elements[prefix] = [element];
                        prefixes.push(prefix);
                    } else {
                        prefixCount[prefix] = oldCount + 1;
                        prefix2Elements[prefix].push(element);
                    }
                });

                prefixes.forEach(prefix => {
                    const prefixElements = prefix2Elements[prefix];
                    const places = ('' + prefixElements.length).length;
                    const formatIndexFun = prefixElements.length === 1 ?
                        (i: number) => '' :
                        (i: number) => `${anoRule.labelParts![indexPartIndex].prefix}${String(i).padStart(places, '0')}`;

                    prefixElements.forEach((element, elementIndex) => {
                        const suffix = this.getComposedLabel(element, afterIndexParts);
                        const infix = formatIndexFun(elementIndex + 1);
                        const anoName = `${anoRule.labelPrefix ?? ''}${prefix}${infix}${suffix}`;
                        element.anonymizedName = anoName;

                        if (conditionsEvalFun && conditionsEvalFun(element)) {
                            element.highlightingInfo!.label = this.getTrimmedLabel(anoName);
                        }
                    });
                });
            } else {
                const labelPartsWoIndex = anoRule.labelParts!.filter(p => p.useIndex === undefined);
                indexedElements.forEach((element: StationData) => {
                    const anoName = (anoRule.labelPrefix ?? '') + this.getComposedLabel(element, labelPartsWoIndex);
                    element.anonymizedName = anoName;

                    if (conditionsEvalFun && conditionsEvalFun(element)) {
                        element.highlightingInfo!.label = this.getTrimmedLabel(anoName);
                    }
                });
            }
        }
        return anoRules.length > 0;
    }

    private getTrimmedLabel(label: string): string {
        return label.trim().replace(/\s+/g, ' ');
    }

    private getComposedLabel(element: DeliveryData | StationData, labelParts: LabelPart[]): string {
        return labelParts.map(p => {
            if (p.property !== undefined) {
                const label = this.mapPropertyValueToString(this.getPropertyValueFromElement(element, p.property!));
                return `${p.prefix ?? ''}${label ?? ''}`;
            } else {
                return p.prefix;
            }
        }).join('');
    }

    private createDeliveryHightlightingInfo(
        delivery: DeliveryData,
        state: DataServiceInputState,
        effElementsStats: HighlightingStats
    ) {
        const activeHighlightingRules = this.getActiveHighlightingRules(delivery, this.enabledDelHRules);

        const deliveryHighlightingInfo: DeliveryHighlightingInfo = this.getCommonHighlightingInfo(delivery, activeHighlightingRules);

        activeHighlightingRules.forEach(rule => effElementsStats.counts[rule.id] = (effElementsStats.counts[rule.id] || 0) + 1);

        return deliveryHighlightingInfo;
    }

    private createStationHighlightingInfo(
        station: StationData,
        state: DataServiceInputState,
        effElementsStats: HighlightingStats
    ): StationHighlightingInfo {

        const activeHighlightingRules = this.getActiveHighlightingRules(station, this.enabledStatHRules);

        const activeShapeRules = activeHighlightingRules.filter(rule => rule.shape !== null);
        const shapes = activeShapeRules.map(rule => rule.shape);

        activeHighlightingRules.forEach(rule => effElementsStats.counts[rule.id] = (effElementsStats.counts[rule.id] || 0) + 1);
        activeShapeRules.forEach((rule, index) => {
            if (index > 0) {
                effElementsStats.conflicts[rule.id] = (effElementsStats.conflicts[rule.id] || 0) + 1;
            }
        });

        const stationHighInfo: StationHighlightingInfo = {
            ...this.getCommonHighlightingInfo(station, activeHighlightingRules),
            shape: shapes.length > 0 ? shapes[0] : null,
            size: station.score
        };

        return stationHighInfo;
    }

    private getCommonHighlightingInfo<
        T extends StationData | DeliveryData,
        K extends(T extends StationData ? StationHighlightingRule : DeliveryHighlightingRule)
    >(
        fclElement: T,
        highlightingRules: K[]
    ): { label: string; color: number[][] } {

        const labelParts: string[] = [];
        for (const rule of highlightingRules) {
            if (rule.labelProperty) {
                const propertyValue = this.getPropertyValueFromElement(fclElement, rule.labelProperty);
                if (propertyValue !== undefined) {
                    const labelValue = this.mapPropertyValueToString(propertyValue);
                    if (labelValue !== undefined) {
                        labelParts.push(labelValue);
                    }
                }
            }
        }

        const color = removeNullish(
            highlightingRules.map(rule => rule.color)
        );

        return {
            label: this.getTrimmedLabel(labelParts.join(' / ')),
            color: color
        };
    }

    private getPropertyValueFromElement(element: StationData | DeliveryData, propertyName: string): PropertyValueType | undefined {
        let propertyValue = element[propertyName];

        if (propertyValue === undefined) {
            const propertyIndex = element.properties.findIndex(property => property.name === propertyName);
            if (propertyIndex >= 0) {
                propertyValue = element.properties[propertyIndex].value;

            }
        }

        return propertyValue;
    }

    private mapPropertyValueToString(propertyValue: PropertyValueType | undefined): string | undefined {
        let newPropertyValue: string | undefined;

        if (propertyValue !== undefined && propertyValue !== null) {
            newPropertyValue = propertyValue.toString();
        }

        return newPropertyValue;
    }

}
