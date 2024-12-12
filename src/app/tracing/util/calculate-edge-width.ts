import { DeliveryData, PropertyEntry } from "../data.model";

export interface DeliveriesValueRange {
    min: number|null,
    max: number|null,
}

export const calculateLinearEdgeWidth = (currentValue:number|null, maxValue:number|null):number|null => {
    if (!currentValue || !maxValue) {
        return null;
    }

    return currentValue / maxValue;
}

export const calculateLogarithmicEdgeWidth = (currentValue:number|null, maxValue:number|null):number|null => {
    if (!currentValue || !maxValue) {
        return null;
    }

    return Math.pow(currentValue, Math.log(maxValue));
}

export const extractNumericAmountFromProps = (properties:PropertyEntry[]):number|null => {
    const amount = properties.find(({name, value}) => name === 'amount' && typeof value === 'number' && !Number.isNaN(value));
    
    return amount === undefined? null : amount.value as number; // see type guard in amounts.find array method
}

const collectNumericAmountsFromDeliveries = (deliveries:DeliveryData[]):number[] => {
    return deliveries
    .map(({properties}):number|null => extractNumericAmountFromProps(properties))
    .filter(amount => amount !== null) as number[];  // see type guard in amounts.filter array method
}

export const getNumericAmountsRangeFromDeliveries = (deliveries:DeliveryData[]):DeliveriesValueRange => {
    const amounts = collectNumericAmountsFromDeliveries(deliveries);

    if (amounts.length < 2) {
        return { min: null, max: null };
    }

   return { 
            min: Math.min(...amounts), 
            max: Math.max(...amounts),
        }
}