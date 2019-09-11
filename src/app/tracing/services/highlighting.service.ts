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
            const visibleMap = Utils.createStringSet(stationIds);
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
        data.statVis = Utils.createStringSet(data.stations.filter(s => !s.invisible).map(s => s.id));
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

        const isCommonLinkHighlighting: {[key: string]: boolean} = {};
        this.getCommonLinkEntries(state).forEach(
            commonLinkHighData => isCommonLinkHighlighting[commonLinkHighData.name] = true
        );

        return {
            stations: state.highlightingSettings.stations.filter(
                hData => hData.showInLegend && (activeHighlightings.stations[hData.name] || isCommonLinkHighlighting[hData.name])
            ).map(
                hData => ({ label: hData.name, color: this.mapToColor(hData.color), shape: hData.shape })
            ),
            deliveries: state.highlightingSettings.deliveries.filter(
                hData => hData.showInLegend && (activeHighlightings.deliveries[hData.name])
            ).map(
                hData => ({ label: hData.name, color: this.mapToColor(hData.color), linePattern: hData.linePattern })
            )
        };
    }

    private mapToColor(color: number[]): Color {
        return (color && color.length === 3) ? { r: color[0], g: color[1], b: color[2] } : null;
    }

    private getCommonLinkEntries(state: BasicGraphState): StationHighlightingData[] {
        return state.highlightingSettings.stations.filter(hSettings => this.isHighlightingSettingCommonLink(hSettings));
    }

    private isHighlightingSettingCommonLink(highlightingSetting: StationHighlightingData | DeliveryHighlightingData): boolean {
        if (
            !highlightingSetting.invisible &&
            highlightingSetting.showInLegend &&
            highlightingSetting.logicalConditions &&
            highlightingSetting.logicalConditions.length === 1 &&
            highlightingSetting.logicalConditions[0].length === 1
        ) {
            const logicalCondition = highlightingSetting.logicalConditions[0][0];
            return (
                logicalCondition.propertyName === 'score' &&
                logicalCondition.operationType === OperationType.EQUAL &&
                logicalCondition.value === '1'
            );
        }
        return false;
    }

    private getActiveHighlightingData<
        T extends StationData | DeliveryData,
        K extends (T extends StationData ? StationHighlightingData : DeliveryHighlightingData)
    >(fclElement: T, highlightingData: K[]): K[] {
        return highlightingData.filter(
            highData => !highData.invisible && (!highData.logicalConditions || highData.logicalConditions.some(andConList => {
                return andConList.every((condition: LogicalCondition) => {
                    const propertyValue = this.getPropertyValueFromElement(fclElement, condition.propertyName);
                    const func = this.OPERATION_TYPE_TO_FUNCTION_MAP[condition.operationType];
                    if (!func) {
                        throw new Error(`Operation type ${condition.operationType} not supported`);
                    }
                    const result = func(condition.value, propertyValue);

                    return result;
                });
            })));
    }
    private createDeliveryHightlightingInfo(delivery: DeliveryData, state: BasicGraphState, activeList: { [key: string]: boolean }) {
        const activeHighlightingData = this.getActiveHighlightingData(delivery, state.highlightingSettings.deliveries);

        const deliveryHighlightingInfo: DeliveryHighlightingInfo = this.getCommonHighlightingInfo(delivery, activeHighlightingData);

        activeHighlightingData.forEach(hData => activeList[hData.name] = true);

        return deliveryHighlightingInfo;
    }

    private createStationHighlightingInfo(
        station: StationData,
        state: BasicGraphState,
        activeList: { [key: string]: boolean }
    ): StationHighlightingInfo {

        const activeHighlightingData = this.getActiveHighlightingData(station, state.highlightingSettings.stations);

        const shape = activeHighlightingData
                .filter(highData => !!highData.shape)
                .map(highData => highData.shape);

        activeHighlightingData.forEach(hData => activeList[hData.name] = true);

        const stationHighInfo: StationHighlightingInfo = {
            ...this.getCommonHighlightingInfo(station, activeHighlightingData),
            shape: shape.length > 0 ? shape[0] : null
        };

        return stationHighInfo;
    }

    private getCommonHighlightingInfo<
        T extends StationData | DeliveryData,
        K extends (T extends StationData ? StationHighlightingData : DeliveryHighlightingData)
    >(
        fclElement: T,
        highlightingData: K[]
    ): { label: string[], color: number[][] } {
        const label = highlightingData
            .filter(highData => !!highData.labelProperty)
            .map(highData => this.mapPropertyValueToString(this.getPropertyValueFromElement(fclElement, highData.labelProperty)))
            .filter(labelValue => (labelValue !== undefined) && (labelValue !== null));

        const color = highlightingData
            .filter(highData => !!highData.color)
            .map(highData => highData.color);

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
