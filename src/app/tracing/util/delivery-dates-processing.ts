import { DataServiceData } from '../data.model';
import { Utils } from './non-ui-utils';
import * as moment from 'moment';

type Range = [number, number];

interface ProcessedDeliveryDates {
    expInRange: Range;
    expOutRange: Range;
    compInRange: Range;
    compOutRange: Range;
}

export interface ProcessedDeliveryDatesMap {
    [key: string]: ProcessedDeliveryDates;
}

interface InternalDeliveryData {
    id: string;
    expInRange: Range;
    expOutRange: Range;
    compInRange?: Range;
    compOutRange?: Range;
    forwardDels?: InternalDeliveryData[];
    backwardDels?: InternalDeliveryData[];
    inplausibleIn?: boolean;
    inplausibleOut?: boolean;
    traversed?: boolean;
}

interface InternalDeliveryDataMap {
    [key: string]: InternalDeliveryData;
}

const MIN_DATE_NUMBER = Number.NEGATIVE_INFINITY;
const MAX_DATE_NUMBER = Number.POSITIVE_INFINITY;
const DATE_PARSE_STRING = 'YYYY-MM-DD';

function stringDateToRange(date: string): Range {
    const mom = moment(date, DATE_PARSE_STRING, true);
    if (mom.isValid()) {
        return [mom.date(), mom.date()];
    } else {
        return [MIN_DATE_NUMBER, MAX_DATE_NUMBER];
    }
}

function getInitialInternalDeliveryData(data: DataServiceData): InternalDeliveryData[] {
    return data.deliveries.map(
        d => ({
            id: d.id,
            expOutRange: d.dateOut ? stringDateToRange(d.dateOut) : [MIN_DATE_NUMBER, MAX_DATE_NUMBER],
            expInRange: d.dateIn ? stringDateToRange(d.dateIn) : [MIN_DATE_NUMBER, MAX_DATE_NUMBER],
            forwardDels: [],
            backwardDels: []
        })
    );
}

function markInplausibleIntraDeliveryDates(deliveries: InternalDeliveryData[]): void {
    for (const delivery of deliveries) {
        delivery.inplausibleIn = delivery.expOutRange[0] > delivery.expInRange[1];
        delivery.inplausibleOut = delivery.inplausibleIn;
    }
}

function setInitialComputedFromExplicitDates(intDels: InternalDeliveryData[]): void {
    for (const delivery of intDels) {
        delivery.compOutRange = [
            delivery.inplausibleOut ? MIN_DATE_NUMBER : delivery.expOutRange[0],
            Math.min(
                delivery.inplausibleOut ? MAX_DATE_NUMBER : delivery.expOutRange[1],
                delivery.inplausibleIn ? MAX_DATE_NUMBER : delivery.expInRange[1]
            )
        ];

        delivery.compInRange = [
            Math.max(
                delivery.inplausibleOut ? MIN_DATE_NUMBER : delivery.expOutRange[0],
                delivery.inplausibleIn ? MIN_DATE_NUMBER : delivery.expInRange[0]
            ),
            delivery.inplausibleIn ? MAX_DATE_NUMBER : delivery.expInRange[1]
        ];
    }
}

function addForwardDeliveries(data: DataServiceData, idToDelMap: InternalDeliveryDataMap): void {
    for (const station of data.stations) {
        for (const connection of station.connections) {
            idToDelMap[connection.source].forwardDels.push(idToDelMap[connection.target]);
        }
    }
}

function addBackwardDeliveries(data: DataServiceData, idToDelMap: InternalDeliveryDataMap): void {
    for (const station of data.stations) {
        for (const connection of station.connections) {
            idToDelMap[connection.target].backwardDels.push(idToDelMap[connection.source]);
        }
    }
}

function resetTraversedFlag(intDels: InternalDeliveryData[]): void {
    intDels.forEach(d => d.traversed = false);
}

function propagateDateForward(delivery: InternalDeliveryData, idToDelMap: InternalDeliveryDataMap): void {
    if (!delivery.traversed) {
        delivery.traversed = true;
        for (const targetDel of delivery.forwardDels) {
            targetDel.compOutRange[0] = Math.max(delivery.compInRange[0], targetDel.compOutRange[0]);
            targetDel.compInRange[0] = Math.max(delivery.compInRange[0], targetDel.compInRange[0]);
            propagateDateForward(targetDel, idToDelMap);
        }
    }
}

function propagateDateBackward(delivery: InternalDeliveryData, idToDelMap: InternalDeliveryDataMap): void {
    if (!delivery.traversed) {
        delivery.traversed = true;
        for (const sourceDel of delivery.backwardDels) {
            sourceDel.compInRange[1] = Math.min(delivery.compOutRange[1], sourceDel.compInRange[1]);
            sourceDel.compOutRange[1] = Math.min(delivery.compOutRange[1], sourceDel.compOutRange[1]);
            propagateDateBackward(sourceDel, idToDelMap);
        }
    }
}

function propagateDateLimits(intDels: InternalDeliveryData[], idToDelMap: InternalDeliveryDataMap) {
    const descendingMinInDels = intDels
        .filter(d => !d.inplausibleIn)
        .sort((d1, d2) => d2.compInRange[0] - d1.compInRange[0]);

    resetTraversedFlag(intDels);
    for (const delivery of descendingMinInDels) {
        propagateDateForward(delivery, idToDelMap);
    }

    const ascendingMaxOutDels = intDels
        .filter(d => !d.inplausibleOut)
        .sort((d1, d2) => d1.compOutRange[1] - d2.compOutRange[1]);

    resetTraversedFlag(intDels);
    for (const delivery of ascendingMaxOutDels) {
        propagateDateBackward(delivery, idToDelMap);
    }
}

function markInplausibleInterDeliveryDates(intDels: InternalDeliveryData[]): number {
    let counter = 0;
    for (const delivery of intDels) {
        if (
            !delivery.inplausibleOut &&
            (
                delivery.expOutRange[0] > delivery.compOutRange[1] ||
                delivery.expOutRange[1] < delivery.compOutRange[0]
            )
        ) {
            counter++;
            delivery.inplausibleOut = true;
        }

        if (
            !delivery.inplausibleIn &&
            (
                delivery.expInRange[0] > delivery.compInRange[1] ||
                delivery.expInRange[1] < delivery.compInRange[0]
            )
        ) {
            counter++;
            delivery.inplausibleIn = true;
        }

    }
    return counter;
}

export function processDeliveryDates(data: DataServiceData): ProcessedDeliveryDatesMap {
    const intDels = getInitialInternalDeliveryData(data);
    const idToDelMap: InternalDeliveryDataMap = Utils.createObjectFromArray(
        intDels,
        (d: InternalDeliveryData) => d.id,
        (d: InternalDeliveryData) => d
    );
    addForwardDeliveries(data, idToDelMap);
    addBackwardDeliveries(data, idToDelMap);
    markInplausibleIntraDeliveryDates(intDels);

    for (let i = 0; i < 2; i++) {
        setInitialComputedFromExplicitDates(intDels);
        propagateDateLimits(intDels, idToDelMap);
        if (i === 0 && markInplausibleInterDeliveryDates(intDels) === 0) {
            break;
        }
    }

    return Utils.createObjectFromArray(
        intDels,
        (d: InternalDeliveryData) => d.id,
        (d: InternalDeliveryData) => ({
            expOutRange: d.expOutRange,
            expInRange: d.expInRange,
            compOutRange: d.compOutRange,
            compInRange: d.compInRange
        })
    );
}
