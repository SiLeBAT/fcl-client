import { Injectable } from '@angular/core';
import {
    DataServiceData,
    BasicGraphState,
    SetHighlightingSettingsPayload,
    HighlightingSettings,
    StationData,
    StationHighlightingInfo,
    StationHighlightingData,
    DeliveryHighlightingInfo,
    DeliveryHighlightingData,
    LogicalCondition,
    OperationType,
    DeliveryData,
    LegendInfo,
    Color
} from '../data.model';
import { Utils } from '../util/non-ui-utils';

type PropertyValueType = (number | string | boolean);
type ConditionValueType = string;

@Injectable({
    providedIn: 'root'
})
export class HighlightingService {

    static readonly DEFAULT_DELIVERY_COLOR: Color = { r: 0, g: 0, b: 0 };

    private readonly OPERATION_TYPE_TO_FUNCTION_MAP: {
        [key: string]: (conditionValue: ConditionValueType, propertyValue: PropertyValueType) => boolean
    } = {
        [OperationType.EQUAL]: this.areValuesEqual,
        [OperationType.NOT_EQUAL]: this.areValuesNotEqual,
        [OperationType.LESS]: this.isPropertyValueLessThanConditionValue,
        [OperationType.GREATER]: this.isPropertyValueGreaterThanConditionValue,
        [OperationType.REGEX_EQUAL]: this.isPropertyValueEqualToRegex,
        [OperationType.REGEX_EQUAL_IGNORE_CASE]: this.isPropertyValueEqualToIgnoreCaseRegex,
        [OperationType.REGEX_NOT_EQUAL]: this.isPropertyValueUnequalToRegex,
        [OperationType.REGEX_NOT_EQUAL_IGNORE_CASE]: this.isPropertyValueUnequalToIgnoreCaseRegex

    };

    private isPropertyValueUnequalToIgnoreCaseRegex(conditionValue: ConditionValueType, propertyValue: PropertyValueType): boolean {
        let result: boolean = false;

        if (propertyValue === undefined) {
            result = false;
        } else if (propertyValue === null) {
            result = (conditionValue !== '');
        } else {
            const strValue = (typeof propertyValue === 'string') ? propertyValue : propertyValue.toString();
            if (conditionValue === '') {
                result = (strValue !== '');
            } else {
                const regExp = new RegExp(conditionValue, 'i');
                result = !regExp.exec(strValue);
            }

        }

        return result;
    }

    private isPropertyValueUnequalToRegex(conditionValue: ConditionValueType, propertyValue: PropertyValueType): boolean {
        let result: boolean = false;

        if (propertyValue === undefined) {
            result = false;
        } else if (propertyValue === null) {
            result = (conditionValue !== '');
        } else {
            const strValue = (typeof propertyValue === 'string') ? propertyValue : propertyValue.toString();
            if (conditionValue === '') {
                result = (strValue !== '');
            } else {
                const regExp = new RegExp(conditionValue);
                result = !regExp.exec(strValue);
            }

        }

        return result;
    }

    private isPropertyValueEqualToIgnoreCaseRegex(conditionValue: ConditionValueType, propertyValue: PropertyValueType): boolean {
        let result: boolean = false;

        if (propertyValue === undefined) {
            result = false;
        } else if (propertyValue === null) {
            result = (conditionValue === '');
        } else {
            const strValue = (typeof propertyValue === 'string') ? propertyValue : propertyValue.toString();
            if (conditionValue === '') {
                result = (strValue === '');
            } else {
                const regExp = new RegExp(conditionValue, 'i');
                result = !!regExp.exec(strValue);
            }

        }

        return result;
    }

    private isPropertyValueEqualToRegex(conditionValue: ConditionValueType, propertyValue: PropertyValueType): boolean {
        let result: boolean = false;

        if (propertyValue === undefined) {
            result = false;
        } else if (propertyValue === null) {
            result = (conditionValue === '');
        } else {
            const strValue = (typeof propertyValue === 'string') ? propertyValue : propertyValue.toString();
            if (conditionValue === '') {
                result = (strValue === '');
            } else {
                const regExp = new RegExp(conditionValue);
                result = !!regExp.exec(strValue);
            }

        }

        return result;
    }

    private areValuesEqual(conditionValue: ConditionValueType, propertyValue: PropertyValueType): boolean {
        let result: boolean = false;

        if ((propertyValue === undefined) || (propertyValue === null)) {
            result = false;
        } else {
            const propertyType = typeof propertyValue;
            if (propertyType === 'boolean') {
                result = (propertyValue as boolean) === !!conditionValue;
            } else if (propertyType === 'string') {
                result = conditionValue.localeCompare(propertyValue as string) === 0;
            } else if (propertyType === 'number') {
                if (!isNaN(conditionValue as any)) {
                    result = (propertyValue as number) === +conditionValue;
                }
            }
        }

        return result;
    }

    private areValuesNotEqual(conditionValue: ConditionValueType, propertyValue: PropertyValueType): boolean {
        let result: boolean = false;

        if ((propertyValue === undefined) || (propertyValue === null)) {
            result = false;
        } else {
            const propertyType = typeof propertyValue;
            if (propertyType === 'boolean') {
                result = (propertyValue as boolean) !== !!conditionValue;
            } else if (propertyType === 'string') {
                result = conditionValue.localeCompare(propertyValue as string) !== 0;
            } else if (propertyType === 'number') {
                if (!isNaN(conditionValue as any)) {
                    result = (propertyValue as number) !== +conditionValue;
                }
            }
        }

        return result;
    }

    private isPropertyValueLessThanConditionValue(conditionValue: ConditionValueType, propertyValue: PropertyValueType): boolean {
        let result: boolean = false;

        if ((propertyValue === undefined) || (propertyValue === null)) {
            result = false;
        } else {
            const propertyType = typeof propertyValue;
            if (propertyType === 'boolean') {
                result = !propertyValue && !!conditionValue;
            } else if (propertyType === 'string') {
                result = conditionValue.localeCompare(propertyValue as string) > 0;
            } else if (propertyType === 'number') {
                if (!isNaN(conditionValue as any)) {
                    result = (propertyValue as number) < +conditionValue;
                }
            }
        }

        return result;
    }

    private isPropertyValueGreaterThanConditionValue(conditionValue: ConditionValueType, propertyValue: PropertyValueType): boolean {
        let result: boolean = false;

        if ((propertyValue === undefined) || (propertyValue === null)) {
            result = false;
        } else {
            const propertyType = typeof propertyValue;
            if (propertyType === 'boolean') {
                result = !!propertyValue && !conditionValue;
            } else if (propertyType === 'string') {
                result = conditionValue.localeCompare(propertyValue as string) < 0;
            } else if (propertyType === 'number') {
                if (!isNaN(conditionValue as any)) {
                    result = (propertyValue as number) > +conditionValue;
                }
            }
        }

        return result;
    }

    getMarkStationsInvisiblePayload(state: HighlightingSettings, stationIds: string[], invisible: boolean): SetHighlightingSettingsPayload {
        let invisibleStations: string[] = [];
        if (invisible) {
            invisibleStations = [].concat(state.invisibleStations, stationIds);
        } else {
            const visibleMap = Utils.createSimpleStringSet(stationIds);
            invisibleStations = state.invisibleStations.filter(id => !visibleMap[id]);
        }
        return {
            highlightingSettings: {
                ...state,
                invisibleStations: invisibleStations
            }
        };
    }

    getClearInvisiblitiesPayload(state: HighlightingSettings): SetHighlightingSettingsPayload {
        return {
            highlightingSettings: {
                ...state,
                invisibleStations: []
            }
        };
    }

    applyVisibilities(state: BasicGraphState, data: DataServiceData) {
        data.stations.forEach(s => s.invisible = false);
        data.getStatById(state.highlightingSettings.invisibleStations).filter(s => s !== null).forEach(s => s.invisible = true);
        data.statVis = Utils.createSimpleStringSet(data.stations.filter(s => !s.invisible).map(s => s.id));
    }

    hasStationVisibilityChanged(oldState: BasicGraphState, newState: BasicGraphState): boolean {
        return !oldState || oldState.highlightingSettings.invisibleStations !== newState.highlightingSettings.invisibleStations;
    }

    hasDeliveryVisibilityChanged(oldState: BasicGraphState, newState: BasicGraphState): boolean {
        return !oldState;
    }

    applyHighlightingProps(state: BasicGraphState, data: DataServiceData): void {
        const activeStationHighlightings: {[key: string]: boolean} = {};
        data.stations
            .filter((station: StationData) => !station.invisible)
            .forEach((station: StationData) => {

                station.highlightingInfo = this.createStationHighlightingInfo(station, state, activeStationHighlightings);

            });

        const activeDeliveryHighlightings: {[key: string]: boolean} = {};
        data.deliveries
            .filter((delivery: DeliveryData) => !delivery.invisible)
            .forEach((delivery: DeliveryData) => {
                delivery.highlightingInfo = this.createDeliveryHightlightingInfo(delivery, state, activeDeliveryHighlightings);
            });

        data.legendInfo = this.getLegendInfo(state, { stations: activeStationHighlightings, deliveries: activeDeliveryHighlightings });
    }

    private getLegendInfo(
        state: BasicGraphState,
        activeHighlightings: { stations: {[key: string]: boolean}, deliveries: {[key: string]: boolean}}
    ): LegendInfo {

        const ruleNameToIsCommonLinkRuleMap: {[key: string]: boolean} = {};
        this.getCommonLinkEntries(state).forEach(
            commonLinkRule => ruleNameToIsCommonLinkRuleMap[commonLinkRule.name] = true
        );

        return {
            stations: state.highlightingSettings.stations.filter(rule =>
                rule.showInLegend &&
                (activeHighlightings.stations[rule.name] || ruleNameToIsCommonLinkRuleMap[rule.name])
            ).map(rule =>
                ({ label: rule.name, color: this.mapToColor(rule.color), shape: rule.shape })
            ),
            deliveries: state.highlightingSettings.deliveries.filter(rule =>
                rule.showInLegend && (activeHighlightings.deliveries[rule.name])
            ).map(rule =>
                ({ label: rule.name, color: this.mapToColor(rule.color), linePattern: rule.linePattern })
            )
        };
    }

    private mapToColor(color: number[]): Color {
        return (color && color.length === 3) ? { r: color[0], g: color[1], b: color[2] } : null;
    }

    private getCommonLinkEntries(state: BasicGraphState): StationHighlightingData[] {
        return state.highlightingSettings.stations.filter(rule => !rule.disabled && this.isCommonLinkRule(rule));
    }

    private isCommonLinkRule(highlightingRule: StationHighlightingData | DeliveryHighlightingData): boolean {
        if (
            !highlightingRule.invisible &&
            highlightingRule.showInLegend &&
            highlightingRule.logicalConditions &&
            highlightingRule.logicalConditions.length === 1 &&
            highlightingRule.logicalConditions[0].length === 1
        ) {
            const logicalCondition = highlightingRule.logicalConditions[0][0];
            return (
                logicalCondition.propertyName === 'score' &&
                logicalCondition.operationType === OperationType.EQUAL &&
                logicalCondition.value === '1'
            );
        }
        return false;
    }

    private getActiveHighlightingRules<
        T extends StationData | DeliveryData,
        K extends (T extends StationData ? StationHighlightingData : DeliveryHighlightingData)
    >(fclElement: T, highlightingRules: K[]): K[] {
        return highlightingRules.filter(rule =>
            !rule.invisible &&
            !rule.disabled &&
            (
                !rule.logicalConditions ||
                rule.logicalConditions.some(andConList => {
                    return andConList.every((condition: LogicalCondition) => {
                        const propertyValue = this.getPropertyValueFromElement(fclElement, condition.propertyName);
                        const func = this.OPERATION_TYPE_TO_FUNCTION_MAP[condition.operationType];
                        if (!func) {
                            throw new Error(`Operation type ${condition.operationType} not supported`);
                        }
                        const result = func(condition.value, propertyValue);

                        return result;
                    });
                })
            )
        );
    }
    private createDeliveryHightlightingInfo(delivery: DeliveryData, state: BasicGraphState, activeList: { [key: string]: boolean }) {
        const activeHighlightingRules = this.getActiveHighlightingRules(delivery, state.highlightingSettings.deliveries);

        const deliveryHighlightingInfo: DeliveryHighlightingInfo = this.getCommonHighlightingInfo(delivery, activeHighlightingRules);

        activeHighlightingRules.forEach(rule => activeList[rule.name] = true);

        return deliveryHighlightingInfo;
    }

    private createStationHighlightingInfo(
        station: StationData,
        state: BasicGraphState,
        activeList: { [key: string]: boolean }
    ): StationHighlightingInfo {

        const activeHighlightingRules = this.getActiveHighlightingRules(station, state.highlightingSettings.stations);

        const shape = activeHighlightingRules
                .filter(rule => rule.shape !== null)
                .map(rule => rule.shape);

        activeHighlightingRules.forEach(rule => activeList[rule.name] = true);

        const stationHighInfo: StationHighlightingInfo = {
            ...this.getCommonHighlightingInfo(station, activeHighlightingRules),
            shape: shape.length > 0 ? shape[0] : null
        };

        return stationHighInfo;
    }

    private getCommonHighlightingInfo<
        T extends StationData | DeliveryData,
        K extends (T extends StationData ? StationHighlightingData : DeliveryHighlightingData)
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
