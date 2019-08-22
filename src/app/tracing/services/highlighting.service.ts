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
    DeliveryData
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
                invisibleStations: invisibleStations
            }
        };
    }

    getClearInvisiblitiesPayload(state: HighlightingSettings): SetHighlightingSettingsPayload {
        return {
            highlightingSettings: {
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
        data.stations
            .filter((station: StationData) => !station.invisible)
            .forEach((station: StationData) => {

                station.highlightingInfo = this.createStationHighlightingInfo(station, state);

            });

        data.deliveries
            .filter((delivery: DeliveryData) => !delivery.invisible)
            .forEach((delivery: DeliveryData) => {
                delivery.highlightingInfo = this.createDeliveryHightlightingInfo(delivery, state);
            });
    }

    private createDeliveryHightlightingInfo(delivery: DeliveryData, state: BasicGraphState) {
        const deliveryHighlightingData: DeliveryHighlightingData[] = state.highlightingSettings.deliveries;

        const deliveryActiveHighlightingData: DeliveryHighlightingData[] = deliveryHighlightingData
            .filter(
                (highData: DeliveryHighlightingData) =>
                    !highData.invisible && (
                        !highData.logicalConditions ||
                        highData.logicalConditions.some(
                            (andConList: LogicalCondition[]) => {
                                return andConList.every(
                                    (condition: LogicalCondition) => {
                                        const propertyValue = this.getPropertyValueFromElement(delivery, condition.propertyName);
                                        const func = this.OPERATION_TYPE_TO_FUNCTION_MAP[condition.operationType];
                                        if (!func) {
                                            throw new Error(`Operation type ${condition.operationType} not supported`);
                                        }
                                        const result = func(condition.value, propertyValue);

                                        return result;
                                    }
                                );
                            }
                        )
                    )
            );

        const label = deliveryActiveHighlightingData
            .filter((highData: DeliveryHighlightingData) => !!highData.labelProperty)
            .map((highData: DeliveryHighlightingData) =>
                this.mapPropertyValueToString(this.getPropertyValueFromElement(delivery, highData.labelProperty))
            )
            .filter(labelValue => (labelValue !== undefined) && (labelValue !== null));

        const color = deliveryActiveHighlightingData
            .filter((highData: DeliveryHighlightingData) => !!highData.color)
            .map((highData: DeliveryHighlightingData) => highData.color);

        const deliveryHighlightingInfo: DeliveryHighlightingInfo = {
            label: label,
            color: color
        };

        return deliveryHighlightingInfo;
    }

    private createStationHighlightingInfo(station: StationData, state: BasicGraphState): StationHighlightingInfo {
        const stationHighlightingData: StationHighlightingData[] = state.highlightingSettings.stations;

        const stationActiveHightlightingData: StationHighlightingData[] = stationHighlightingData.filter(
            highData => !highData.invisible && (!highData.logicalConditions || highData.logicalConditions.some(andConList => {
                return andConList.every((condition: LogicalCondition) => {
                    const propertyValue = this.getPropertyValueFromElement(station, condition.propertyName);
                    const func = this.OPERATION_TYPE_TO_FUNCTION_MAP[condition.operationType];
                    if (!func) {
                        throw new Error(`Operation type ${condition.operationType} not supported`);
                    }
                    const result = func(condition.value, propertyValue);

                    return result;
                });
            })));

        const label = stationActiveHightlightingData
                .filter(highData => !!highData.labelProperty)
                .map(highData => this.mapPropertyValueToString(this.getPropertyValueFromElement(station, highData.labelProperty)))
                .filter(labelValue => (labelValue !== undefined) && (labelValue !== null));

        const shape = stationActiveHightlightingData
                .filter(highData => !!highData.shape)
                .map(highData => highData.shape);

        const color = stationActiveHightlightingData
            .filter((highData: StationHighlightingData) => !!highData.color)
            .map((highData: StationHighlightingData) => highData.color);

        const stationHighInfo: StationHighlightingInfo = {
            label: label,
            color: color,
            shape: shape.length > 0 ? shape[0] : null
        };

        return stationHighInfo;
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
