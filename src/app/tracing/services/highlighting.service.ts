import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { createPreprocessedConditions } from '../configuration/complex-row-filter-provider';
import {
    DataServiceData,
    StationData,
    StationHighlightingInfo,
    DeliveryHighlightingInfo,
    DeliveryData,
    LegendInfo,
    Color,
    StationHighlightingRule,
    DeliveryHighlightingRule,
    HighlightingRule,
    OperationType,
    DataServiceInputState,
    StationId,
    DeliveryId
} from '../data.model';
import { Utils } from '../util/non-ui-utils';

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

    private preprocessHighlightings(state: DataServiceInputState): void {
        const statRulesChanged = state.highlightingSettings.stations !== this.statHighlightingRules;
        const delRulesChanged = state.highlightingSettings.deliveries !== this.delHighlightingRules;
        if (statRulesChanged) {
            this.statHighlightingRules = state.highlightingSettings.stations;
            this.statRuleIdToEvaluatorFunMap = {};
            state.highlightingSettings.stations.forEach(
                rule => this.statRuleIdToEvaluatorFunMap[rule.id] = this.getEvaluatorFunFromRule(rule)
            );
        }
        if (delRulesChanged) {
            this.delHighlightingRules = state.highlightingSettings.deliveries;
            this.delRuleIdToEvaluatorFunMap = {};
            state.highlightingSettings.deliveries.forEach(
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

        const ruleIdToStatCountMap: Record<RuleId, number> = {};
        state.highlightingSettings.stations.forEach(rule => ruleIdToStatCountMap[rule.id] = 0);
        const ruleIdToConflictCountMap: Record<RuleId, number> = {};

        data.stations
            .filter((station: StationData) => !station.contained)
            .forEach((station: StationData) => {

                station.highlightingInfo = this.createStationHighlightingInfo(
                    station, state, ruleIdToStatCountMap, ruleIdToConflictCountMap
                );

            });

        const ruleIdToDelCountMap: Record<RuleId, number> = {};
        state.highlightingSettings.deliveries.forEach(rule => ruleIdToStatCountMap[rule.id] = 0);
        data.deliveries
            .forEach((delivery: DeliveryData) => {

                delivery.highlightingInfo = this.createDeliveryHightlightingInfo(delivery, state, ruleIdToDelCountMap);

            });

        data.legendInfo = this.getLegendInfo(state, {
            stations: Utils.mapRecordValues(ruleIdToStatCountMap, (x: number) => x > 0),
            deliveries: Utils.mapRecordValues(ruleIdToDelCountMap, (x: number) => x > 0)
        });
        data.highlightingStats = {
            stationRuleStats: {
                counts: ruleIdToStatCountMap,
                conflicts: ruleIdToConflictCountMap
            },
            deliveryRuleStats: {
                counts: ruleIdToDelCountMap
            }
        };
    }

    private getLegendInfo(
        state: DataServiceInputState,
        activeHighlightings: { stations: Record<RuleId, boolean>, deliveries: Record<RuleId, boolean>}
    ): LegendInfo {

        const ruleIdToIsCommonLinkRuleMap: Record<RuleId, boolean> = {};
        this.getCommonLinkEntries(state).forEach(
            commonLinkRule => ruleIdToIsCommonLinkRuleMap[commonLinkRule.id] = true
        );

        return {
            stations: state.highlightingSettings.stations.filter(rule =>
                rule.showInLegend &&
                (activeHighlightings.stations[rule.id] || ruleIdToIsCommonLinkRuleMap[rule.id])
            ).map(rule =>
                ({ label: rule.name, color: this.mapToColor(rule.color), shape: rule.shape })
            ),
            deliveries: state.highlightingSettings.deliveries.filter(rule =>
                rule.showInLegend && (activeHighlightings.deliveries[rule.id])
            ).map(rule =>
                ({ label: rule.name, color: this.mapToColor(rule.color), linePattern: rule.linePattern })
            )
        };
    }

    private mapToColor(color: number[]): Color {
        return (color && color.length === 3) ? { r: color[0], g: color[1], b: color[2] } : null;
    }

    private getCommonLinkEntries(state: DataServiceInputState): StationHighlightingRule[] {
        return state.highlightingSettings.stations.filter(rule => !rule.disabled && this.isCommonLinkRule(rule));
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
        K extends (T extends StationData ? StationHighlightingRule : DeliveryHighlightingRule)
    >(fclElement: T, highlightingRules: K[]): K[] {
        return highlightingRules.filter(rule =>
            !rule.invisible &&
            !rule.disabled &&
            (
                !rule.logicalConditions ||
                this.ruleIdToEvaluatorFunMap[rule.id](fclElement)
            )
        );
    }
    private createDeliveryHightlightingInfo(
        delivery: DeliveryData,
        state: DataServiceInputState,
        ruleIdToDelCountMap: Record<RuleId, number>
    ) {
        const activeHighlightingRules = this.getActiveHighlightingRules(delivery, state.highlightingSettings.deliveries);

        const deliveryHighlightingInfo: DeliveryHighlightingInfo = this.getCommonHighlightingInfo(delivery, activeHighlightingRules);

        activeHighlightingRules.forEach(rule => ruleIdToDelCountMap[rule.id] = (ruleIdToDelCountMap[rule.id] || 0) + 1);

        return deliveryHighlightingInfo;
    }

    private createStationHighlightingInfo(
        station: StationData,
        state: DataServiceInputState,
        ruleIdToStatCountMap: Record<RuleId, number>,
        ruleIdToConflictCountMap: Record<RuleId, number>
    ): StationHighlightingInfo {

        const activeHighlightingRules = this.getActiveHighlightingRules(station, state.highlightingSettings.stations);

        const activeShapeRules = activeHighlightingRules.filter(rule => rule.shape !== null);
        const shapes = activeShapeRules.map(rule => rule.shape);

        activeHighlightingRules.forEach(rule => ruleIdToStatCountMap[rule.id] = (ruleIdToStatCountMap[rule.id] || 0) + 1);
        activeShapeRules.forEach((rule, index) => {
            if (index > 0) {
                ruleIdToConflictCountMap[rule.id] = (ruleIdToConflictCountMap[rule.id] || 0) + 1;
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
        K extends (T extends StationData ? StationHighlightingRule : DeliveryHighlightingRule)
    >(
        fclElement: T,
        highlightingRules: K[]
    ): { label: string[], color: number[][] } {
        const label = highlightingRules
            .filter(rule => rule.labelProperty !== null)
            .map(rule => this.mapPropertyValueToString(this.getPropertyValueFromElement(fclElement, rule.labelProperty)))
            .filter(labelValue => (labelValue !== undefined) && (labelValue !== null));

        const color = highlightingRules
            .filter(rule => rule.color !== null)
            .map(rule => rule.color);

        return {
            label: label,
            color: color
        };
    }

    private getPropertyValueFromElement(element: StationData | DeliveryData, propertyName: string): PropertyValueType {
        let propertyValue = element[propertyName];

        if (propertyValue === undefined) {
            const propertyIndex = element.properties.findIndex(property => property.name === propertyName);
            if (propertyIndex >= 0) {
                propertyValue = element.properties[propertyIndex].value;

            }
        }

        return propertyValue;
    }

    private mapPropertyValueToString(propertyValue: PropertyValueType): string {
        let newPropertyValue: string = null;

        if (propertyValue !== undefined && propertyValue !== null) {
            newPropertyValue = propertyValue.toString();
        }

        return newPropertyValue;
    }

}
