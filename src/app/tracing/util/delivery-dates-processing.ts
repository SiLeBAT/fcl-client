import { DataServiceData } from '../data.model';
import { Utils } from './non-ui-utils';
import * as moment from 'moment';

const MIN_DATE_NUMBER = Number.NEGATIVE_INFINITY;
const MAX_DATE_NUMBER = Number.POSITIVE_INFINITY;
const DATE_PARSE_STRINGS = ['YYYY-MM-DD', 'DD.MM.YYYY'];

interface Range {
    min: number;
    max: number;
}

export interface ProcessedDeliveryDates {
    outRange: Range;
    inRange: Range;
}

export interface ProcessedDeliveryDatesSet {
    expDates: ProcessedDeliveryDates;
    compDates: ProcessedDeliveryDates;
}

export interface ProcessedDeliveryDatesSetMap {
    [key: string]: ProcessedDeliveryDatesSet;
}

interface InternalDeliveryData {
    id: string;
    expDates: ProcessedDeliveryDates;
    compDates?: ProcessedDeliveryDates;
    forwardDels: InternalDeliveryData[];
    backwardDels: InternalDeliveryData[];
    inplausibleIn?: boolean;
    inplausibleOut?: boolean;
    traversed?: boolean;
}

interface InternalDeliveryDataMap {
    [key: string]: InternalDeliveryData;
}

function createFreeDateRange(): Range {
    return { min: MIN_DATE_NUMBER, max: MAX_DATE_NUMBER };
}

function stringDateToRange(date: string | undefined): Range {
    if (date) {
        const mom = moment(date, DATE_PARSE_STRINGS, true);
        if (mom.isValid()) {
            return { min: mom.valueOf(), max: mom.valueOf() };
        }
    }
    return createFreeDateRange();
}

function getInitialInternalDeliveryData(data: DataServiceData): InternalDeliveryData[] {
    return data.deliveries.map(
        d => ({
            id: d.id,
            expDates: {
                outRange: stringDateToRange(d.dateOut),
                inRange: stringDateToRange(d.dateIn)
            },
            forwardDels: [],
            backwardDels: []
        })
    );
}

function markInplausibleIntraDeliveryDates(deliveries: InternalDeliveryData[]): void {
    for (const delivery of deliveries) {
        delivery.inplausibleIn = delivery.expDates.outRange.min > delivery.expDates.inRange.max;
        delivery.inplausibleOut = delivery.inplausibleIn;
    }
}

function setInitialComputedFromExplicitDates(intDels: InternalDeliveryData[]): void {
    for (const delivery of intDels) {
        delivery.compDates = {
            outRange: {
                min: delivery.inplausibleOut ? MIN_DATE_NUMBER : delivery.expDates.outRange.min,
                max: Math.min(
                    delivery.inplausibleOut ? MAX_DATE_NUMBER : delivery.expDates.outRange.max,
                    delivery.inplausibleIn ? MAX_DATE_NUMBER : delivery.expDates.inRange.max
                )
            },
            inRange: {
                min: Math.max(
                    delivery.inplausibleOut ? MIN_DATE_NUMBER : delivery.expDates.outRange.min,
                    delivery.inplausibleIn ? MIN_DATE_NUMBER : delivery.expDates.inRange.min
                ),
                max: delivery.inplausibleIn ? MAX_DATE_NUMBER : delivery.expDates.inRange.max
            }
        };
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
            targetDel.compDates!.outRange.min = Math.max(delivery.compDates!.inRange.min, targetDel.compDates!.outRange.min);
            targetDel.compDates!.inRange.min = Math.max(delivery.compDates!.inRange.min, targetDel.compDates!.inRange.min);
            propagateDateForward(targetDel, idToDelMap);
        }
    }
}

function propagateDateBackward(delivery: InternalDeliveryData, idToDelMap: InternalDeliveryDataMap): void {
    if (!delivery.traversed) {
        delivery.traversed = true;
        for (const sourceDel of delivery.backwardDels) {
            sourceDel.compDates!.inRange.max = Math.min(delivery.compDates!.outRange.max, sourceDel.compDates!.inRange.max);
            sourceDel.compDates!.outRange.max = Math.min(delivery.compDates!.outRange.max, sourceDel.compDates!.outRange.max);
            propagateDateBackward(sourceDel, idToDelMap);
        }
    }
}

function propagateDateLimits(intDels: InternalDeliveryData[], idToDelMap: InternalDeliveryDataMap) {
    const descendingMinInDels = intDels
        .filter(d => !d.inplausibleIn)
        .sort((d1, d2) => d2.compDates!.inRange.min - d1.compDates!.inRange.min);

    resetTraversedFlag(intDels);
    for (const delivery of descendingMinInDels) {
        propagateDateForward(delivery, idToDelMap);
    }

    const ascendingMaxOutDels = intDels
        .filter(d => !d.inplausibleOut)
        .sort((d1, d2) => d1.compDates!.outRange.max - d2.compDates!.outRange.max);

    resetTraversedFlag(intDels);
    for (const delivery of ascendingMaxOutDels) {
        propagateDateBackward(delivery, idToDelMap);
    }
}

function testForAndMarkInplausibleInterDeliveryDates(intDels: InternalDeliveryData[]): boolean {
    let inplausiblitiesFound = false;
    for (const delivery of intDels) {
        if (
            !delivery.inplausibleOut &&
            (
                delivery.expDates.outRange.min > delivery.compDates!.outRange.max ||
                delivery.expDates.outRange.max < delivery.compDates!.outRange.min
            )
        ) {
            inplausiblitiesFound = true;
            delivery.inplausibleOut = true;
        }

        if (
            !delivery.inplausibleIn &&
            (
                delivery.expDates.inRange.min > delivery.compDates!.inRange.max ||
                delivery.expDates.inRange.max < delivery.compDates!.inRange.min
            )
        ) {
            inplausiblitiesFound = true;
            delivery.inplausibleIn = true;
        }

    }
    return inplausiblitiesFound;
}

function deriveComputedFromExplicitDates(intDels: InternalDeliveryData[], idToDelMap: InternalDeliveryDataMap): void {
    setInitialComputedFromExplicitDates(intDels);
    propagateDateLimits(intDels, idToDelMap);
}

export function processDeliveryDates(data: DataServiceData): ProcessedDeliveryDatesSetMap {
    const intDels = getInitialInternalDeliveryData(data);
    const idToDelMap: InternalDeliveryDataMap = Utils.createObjectFromArray(
        intDels,
        (d: InternalDeliveryData) => d.id,
        (d: InternalDeliveryData) => d
    );
    addForwardDeliveries(data, idToDelMap);
    addBackwardDeliveries(data, idToDelMap);
    markInplausibleIntraDeliveryDates(intDels);

    deriveComputedFromExplicitDates(intDels, idToDelMap);
    if (testForAndMarkInplausibleInterDeliveryDates(intDels)) {
        deriveComputedFromExplicitDates(intDels, idToDelMap);
    }

    return Utils.createObjectFromArray(
        intDels,
        (d: InternalDeliveryData) => d.id,
        (d: InternalDeliveryData) => ({
            expDates: d.expDates,
            compDates: d.compDates
        })
    );
}
