import { DeliveryData, PropertyEntry } from "../data.model";

export interface DeliveriesValueRange {
    min: number|null,
    max: number|null,
}

export const calculateLinearEdgeWidth = (currentValue, minRealValue, maxRealValue, minProjectedValue, maxProjectedValue) => {
    if(typeof currentValue !== 'number' || Number.isNaN(currentValue)) {
        return minProjectedValue;
    }

    return ((currentValue - minRealValue) * (maxProjectedValue - minProjectedValue)) / (maxRealValue - minRealValue) + minProjectedValue;
    // source: https://www.30secondsofcode.org/js/s/clamp-or-map-number-to-range/ 
};

export const calculateLogarithmicEdgeWidth = (currentValue, minRealValue, maxRealValue, minProjectedValue, maxProjectedValue) => {

    /// BUG! FIX
    if(typeof currentValue !== 'number' || Number.isNaN(currentValue)) {
        return minProjectedValue;
    }

    return Math.pow(currentValue, Math.log(maxRealValue));
};

  /*
export const calculateLinearEdgeWidth = (currentValue:number|null, maxValue:number|null):number => {
    if (!currentValue || !maxValue) {
        return 0;
    }

    return currentValue / maxValue;
}

export const calculateLogarithmicEdgeWidth = (currentValue:number|null, maxValue:number|null):number => {
    if (!currentValue || !maxValue) {
        return 0;
    }

    return Math.pow(currentValue, Math.log(maxValue));
}
*/

export const extractNumericAmountFromProps = (properties:PropertyEntry[],):number|null => {
    const amount = properties.find(({name, value}) => name === 'amount' && typeof value === 'number' && !Number.isNaN(value));
    
    return amount === undefined? null : amount.value as number; // see type guard in amounts.find array method
}

const collectNumericAmountsFromDeliveries = (deliveries:DeliveryData[]):any[] => {
    return deliveries
    .map(({properties}):number|null => extractNumericAmountFromProps(properties))
    .filter(amount => amount !== null);
}

export const getNumericAmountsRangeFromDeliveries = (deliveries:DeliveryData[]):DeliveriesValueRange => {
    const amounts = collectNumericAmountsFromDeliveries(deliveries);

    if (amounts.length < 2) {
        return { min: 0, max: 0 };
    }

   return { 
            min: Math.min(...amounts), 
            max: Math.max(...amounts),
        }
}