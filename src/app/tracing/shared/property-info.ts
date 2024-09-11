import { SampleData, StationData, DeliveryData } from "../data.model";
import { concat, Utils } from "../util/non-ui-utils";

export type PropId = string;
type PropValue = number | boolean | string;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Properties extends Record<PropId, PropValue> {}

export interface PropInfo {
    prop: PropId;
    label: string;
}

const PUBLIC_STATION_PROPS: (keyof StationData)[] = ["id", "name"];
const PUBLIC_DELIVERY_PROPS: (keyof DeliveryData)[] = [
    "id",
    "name",
    "lot",
    "dateIn",
    "dateOut",
    "backward",
    "crossContamination",
    "forward",
    "killContamination",
    "weight",
    "observed",
    "score",
    "source",
    "selected",
    "source",
    "originalSource",
    "target",
    "originalTarget",
    "invisible",
];

const DELIVERY_SPECIFIC_PROPS: (keyof DeliveryData)[] = [
    "id",
    "dateIn",
    "dateOut",
    "backward",
    "crossContamination",
    "forward",
    "killContamination",
    "weight",
    "observed",
    "score",
    "source",
    "selected",
    "source",
    "originalSource",
    "target",
    "originalTarget",
    "invisible",
];

function getPublicProperties(
    fclItems: StationData[] | DeliveryData[],
    publicProps: string[],
): string[] {
    const props = publicProps.filter((prop) =>
        fclItems.some((item) => item[prop] !== undefined),
    );
    const otherProps: { [key: string]: boolean } = {};
    for (const item of fclItems) {
        for (const propEntry of item.properties) {
            otherProps[propEntry.name] = true;
        }
    }
    return concat(props, Object.keys(otherProps));
}

export function getPublicStationProperties(
    stations: StationData[],
): PropInfo[] {
    return getPublicProperties(stations, PUBLIC_STATION_PROPS).map((prop) => ({
        prop: prop,
        label: prop,
    }));
}

export function getPublicDeliveryProperties(
    deliveries: DeliveryData[],
): PropInfo[] {
    return getPublicProperties(deliveries, PUBLIC_DELIVERY_PROPS).map(
        (prop) => ({ prop: prop, label: prop }),
    );
}

export function getLotProperties(deliveries: DeliveryData[]): PropInfo[] {
    // there is not lot entity in the data model
    // so the lot specific properties need to be collected
    // a delivery property is considered a lot property iif all deliveries within a lot
    // have the same value for this property
    const deliveryGroups = Utils.groupDeliveriesByLot(deliveries);
    const directLotProps = PUBLIC_DELIVERY_PROPS.filter(
        (p) => DELIVERY_SPECIFIC_PROPS.indexOf(p) < 0,
    );
    const availableProps: Set<PropId> = new Set();
    const inConsistentProps: Set<PropId> = new Set();
    for (const deliveryGroup of deliveryGroups) {
        const refProps = getDeliveryProperties(
            deliveryGroup[0],
            directLotProps,
        );
        const propsToCheck = Object.keys(refProps);
        propsToCheck.forEach((propId) => availableProps.add(propId));
        if (deliveryGroup.length > 1) {
            for (let i = deliveryGroup.length - 1; i >= 1; i--) {
                const deliveryProps = getDeliveryProperties(
                    deliveryGroup[i],
                    directLotProps,
                );
                for (const propId of propsToCheck) {
                    if (deliveryProps[propId] !== refProps[propId]) {
                        inConsistentProps.add(propId);
                    }
                    delete deliveryProps[propId];
                }
                const unmatchedProps = Object.keys(deliveryProps);
                unmatchedProps.forEach((p) => {
                    availableProps.add(p);
                    inConsistentProps.add(p);
                });
            }
        }
    }

    const lotProps = [...availableProps].filter(
        (pId) => !inConsistentProps.has(pId),
    );
    lotProps.sort();
    return lotProps.map((p) => ({
        prop: p,
        label: p,
    }));
}

function getDeliveryProperties(
    delivery: DeliveryData,
    directProps: string[],
): Properties {
    const result: Properties = {};
    for (const propName of directProps) {
        const value = delivery[propName];
        if (value !== null && value !== undefined) {
            result[propName] = delivery[propName];
        }
    }
    for (const prop of delivery.properties) {
        result[prop.name] = prop.value;
    }
    return result;
}

export function getSampleProperties(samples: SampleData[]): PropInfo[] {
    const props: { [key: string]: boolean } = {};
    for (const sample of samples) {
        Object.keys(sample).forEach((prop) => (props[prop] = true));
    }
    return Object.keys(props).map((prop) => ({
        prop: prop,
        label: prop,
    }));
}
