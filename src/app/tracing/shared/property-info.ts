import {
    SampleData,
    StationData,
    DeliveryData
} from '../data.model';
import { Utils } from '../util/non-ui-utils';

export interface PropInfo {
    prop: string;
    label: string;
}

const PUBLIC_STATION_PROPS: (keyof StationData)[] = ['id', 'name'];
const PUBLIC_DELIVERY_PROPS: (keyof DeliveryData)[] = ['name', 'lot', 'dateIn', 'dateOut'];

const DELIVERY_SPECIFIC_PROPS: (keyof DeliveryData)[] = ['id', 'dateIn', 'dateOut'];

function getPublicProperties(fclItems: StationData[] | DeliveryData[], publicProps: string[]): string[] {
    const props = publicProps.filter(prop => fclItems.some(item => item[prop] !== undefined));
    const otherProps: { [key: string]: boolean } = {};
    for (const item of fclItems) {
        for (const propEntry of item.properties) {
            otherProps[propEntry.name] = true;
        }
    }
    return [].concat(props, Object.keys(otherProps));
}

export function getPublicStationProperties(stations: StationData[]): PropInfo[] {
    return getPublicProperties(stations, PUBLIC_STATION_PROPS).map(prop => ({ prop: prop, label: prop }));
}

export function getPublicDeliveryProperties(deliveries: DeliveryData[]): PropInfo[] {
    return getPublicProperties(deliveries, PUBLIC_DELIVERY_PROPS).map(prop => ({ prop: prop, label: prop }));
}

export function getLotProperties(deliveries: DeliveryData[]): PropInfo[] {
    // there is not lot entity in the data model
    // so the lot specific properties need to be collected
    // a delivery property is considered a lot property iif all deliveries within a lot
    // have the same value for this property
    const deliveryGroups = Utils.groupDeliveryByLot(deliveries);
    const propCandidates: { [key: string]: any } = {};
    const ignoreProps: { [key: string]: any } = {};
    DELIVERY_SPECIFIC_PROPS.forEach(prop => ignoreProps[prop] = true);

    deliveryGroups.forEach(deliveryGroup => {
        // consider explicit props
        PUBLIC_DELIVERY_PROPS.forEach(prop => {
            // this property must have the same value for each delivery coming from the same lot
            if (!ignoreProps[prop]) {
                const value = deliveryGroup[0][prop];
                if (deliveryGroup.some(d => d[prop] !== value)) {
                    // the values are not identical, ignore this property
                    ignoreProps[prop] = true;
                } else if (value !== undefined) {
                    propCandidates[prop] = true;
                }
            }
        });

        // consider other props
        const refPropValues = deliveryGroup[0].properties.filter(
            p => !ignoreProps[p.name] && p.value !== undefined
        ).reduce(
            (pV, cV) => {
                pV[cV.name] = cV.value;
                return pV;
            }, {} as { [key: string]: string | number | boolean }
        );
        for (const delivery of deliveryGroup) {
            const checkProps = Utils.createSimpleStringSet(Object.keys(refPropValues));
            for (const prop of delivery.properties) {
                if (!ignoreProps[prop.name]) {
                    if (refPropValues[prop.name] !== prop.value) {
                        ignoreProps[prop.name] = true;
                    }
                }
                checkProps[prop.name] = false;
            }
            Utils.arrayFromSimpleStringSet(checkProps).forEach(prop => ignoreProps[prop] = true);
        }
    });

    return Utils.arrayFromSimpleStringSet(propCandidates).filter(prop => !ignoreProps[prop]).map(
        p => ({ prop: p, label: p })
    );
}

export function getSampleProperties(samples: SampleData[]): PropInfo[] {
    const props: { [key: string]: boolean } = {};
    for (const sample of samples) {
        Object.keys(sample).forEach(prop => props[prop] = true);
    }
    return Object.keys(props).map(prop => ({
        prop: prop,
        label: prop
    }));
}
