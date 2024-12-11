import { DeliveryData, PropertyEntry } from "../data.model";

export interface DeliveriesValueRange {
    min: number|null,
    max: number|null,
}

export const calculateLinearEdgeWidth = (currentValue:number|null, maxValue:number|null):number|null => {
    if(!currentValue || !maxValue) {
        return null;
    }

    return currentValue / maxValue;
}

export const calculateLogarithmicEdgeWidth = (currentValue:number|null, maxValue:number|null):number|null => {
    if(!currentValue || !maxValue) {
        return null;
    }

    const logBase = Math.log(maxValue);
    return Math.pow(currentValue, logBase);
}

export const extractAmountFromProps = (properties:PropertyEntry[]):number|null => {
    const amount = properties.find(({name, value}) => name === 'amount' && typeof value === 'number' && !Number.isNaN(value));

    if (typeof amount === 'undefined') {
        return null;
    }

    return amount.value as number; // see type guard in properties.find array method
}

export const getAmountsRange = (deliveries:DeliveryData[]):DeliveriesValueRange => {
    const amounts = deliveries
    .map(({properties}):number|null => extractAmountFromProps(properties))
    .filter(amount => amount !== null);

    if (amounts.length < 2) {
        return { min: null, max: null}
    }

   return { 
            min: Math.min(...amounts as number[]), 
            max: Math.max(...amounts as number[]),
        } // see type guard in amounts.find array method
}