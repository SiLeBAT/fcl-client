import { DeliveryData, Color, HighlightingRule } from "../data.model";
import { HttpClient } from "@angular/common/http";
import { Map as ImmutableMap } from "immutable";
import * as _ from "lodash";
import { RequiredPick } from "./utility-types";

type USwitch<A, B> = (A | unknown extends A ? B : A) & A;
type RecordKeyType = string | number | symbol;

export function concat<T>(...args: (T[] | ConcatArray<T>)[]): T[] {
    return ([] as T[]).concat(...args);
}

export function filter<T, K extends T>(array: T[], fun: (x: T) => x is K): K[] {
    return array.filter(fun);
}

export function entries<T extends string, K>(
    object: Record<T, K> | Partial<Record<T, K>>,
): [T, K][] {
    return Object.entries(object) as [T, K][];
}

export function values<T extends string, K>(
    object: Record<T, K> | Partial<Record<T, K>>,
): K[] {
    return Object.values(object) as K[];
}

export function areSetsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    return a.size === b.size && Array.from(a).every((x) => b.has(x));
}

export function areSetsDisjoint<T>(a: Set<T>, b: Set<T>): boolean {
    return a.size > 0 && b.size > 0 && !Array.from(a).some((x) => b.has(x));
}

export function unionOfSets<T>(...sets: Set<T>[]): Set<T> {
    if (sets.length === 0) {
        return new Set<T>();
    }
    if (sets.length === 1) {
        return sets[0];
    }
    const result = new Set(Array.from(sets[0]));
    for (let i = 1; i < sets.length; i++) {
        sets[i].forEach((element) => result.add(element));
    }
    return result;
}

export function difference<T>(set1: Set<T>, set2: Set<T>): Set<T> {
    return new Set(Array.from(set1).filter((x) => !set2.has(x)));
}

export function isNullish(x: any): x is undefined | null {
    return x === null || x === undefined;
}

export function isNotNullish<T>(x: T): x is Exclude<T, undefined | null> {
    return x !== null && x !== undefined;
}

export function removeNullish<T>(arr: T[]): Exclude<T, undefined | null>[] {
    return arr.filter(isNotNullish);
}

export function removeNull<T>(arr: T[]): Exclude<T, null>[] {
    return arr.filter((x) => x !== null) as Exclude<T, null>[];
}

export function removeUndefined<T>(arr: T[]): Exclude<T, undefined>[] {
    return arr.filter((x) => x !== undefined) as Exclude<T, undefined>[];
}

export function removeNullishPick<
    T,
    K extends keyof T,
    R extends Omit<T, K> & {
        [Property in K]: Exclude<T[Property], null | undefined>;
    },
>(arr: T[], key: K): R[] {
    return arr.filter((x) => x[key] != null) as unknown[] as R[];
}

export function mapColumns<T, K>(
    m: T[][],
    fun: (col: (T | undefined)[]) => K,
): K[] {
    if (m.length === 0) {
        return [];
    } else {
        const columnCount = Math.max(...m.map((r) => r.length));
        const mapping = Array<K>(columnCount);
        for (let c = 0; c < columnCount; c++) {
            const column = m.map((r) => r[c]);
            mapping[c] = fun(column);
        }
        return mapping;
    }
}

export function isAnoRule(
    rule: HighlightingRule,
): rule is RequiredPick<HighlightingRule, "labelParts"> {
    return !isNullish(rule.labelParts);
}

export function createMatrix<T>(
    rowCount: number,
    columnCount: number,
    value: T,
): T[][] {
    const result: T[][] = [];
    for (let r = rowCount - 1; r >= 0; r--) {
        result[r] = new Array<T>(columnCount).fill(value);
    }
    return result;
}

export function isNotEmpty(
    x: string | null | undefined,
): x is Exclude<string, ""> {
    return (x ?? "") !== "";
}

export function isArrayNotEmpty<T>(array: T[]): array is [T, ...T[]] {
    return array.length > 0;
}

export function joinNonEmptyTexts(texts: string[], sep: string = " "): string {
    return texts.filter((t) => t !== "").join(sep);
}

export function getKeys<T extends Record<string, unknown>>(
    obj: T,
): (keyof T & string)[] {
    return Object.keys(obj) as (keyof T & string)[];
}

/**
 * Adds all the non empty elements of an array into a string, separated by the specified separator string.
 * If the array has no non empty elements than undefined is returned otherwise the join result.
 * An element is considered as empty if it is nullish or an empty string.
 * @param array
 * @param sep
 * @returns
 */
export function joinNonEmptyElementsOrUndefined(
    array: any[],
    sep: string,
): string | undefined {
    const filteredArr = array.filter((x) => isNotNullish(x) && x !== "");
    return filteredArr.length === 0 ? undefined : filteredArr.join(sep);
}

/**
 * Returns a finite number if the passed value is a finite number or
 * is a string which can be converted to a finit number otherwise undefined.
 *
 * String conversions are done with Number.parseFloat.
 * Finite checks are done with Number.isFinite
 *
 * @param value Some value representing the number.
 */
export function getFiniteNumberOrUndefined(value: any): number | undefined {
    if (typeof value === "string") {
        const numValue = Number.parseFloat(value);
        return Number.isFinite(numValue) ? numValue : undefined;
    } else if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    return undefined;
}

/**
 * This method is used to update an object in a type safe manner.
 *
 * @param obj Object to update
 * @param update Updated information of obj
 * @returns Updated Object
 *
 */
export function getUpdatedObject<T>(obj: T, update: Partial<T>): T {
    return { ...obj, ...update };
}

export function getReverseRecord<
    K extends string | number,
    V extends string | number,
>(record: Record<K, V>): Record<V, K> {
    return Object.fromEntries(
        entries(record).map(([key, value]) => [value, key]),
    ) as Record<V, K>;
}
export class Utils {
    static rgbArrayToColor(color: number[]): Color {
        return { r: color[0], g: color[1], b: color[2] };
    }

    static colorToRGBArray(color: Color): number[] {
        return [color.r, color.g, color.b];
    }

    static colorToCss(color: Color): string {
        return `rgb(${color.r},${color.g},${color.b})`;
    }

    static rgbToHsl(r, g, b) {
        // Make r, g, and b fractions of 1
        r /= 255;
        g /= 255;
        b /= 255;

        // Find greatest and smallest channel values
        const cmin = Math.min(r, g, b);
        const cmax = Math.max(r, g, b);
        const delta = cmax - cmin;
        let h = 0;
        let s = 0;
        let l = 0;

        // Calculate hue
        // No difference
        if (delta === 0) {
            h = 0;
            // Red is max
        } else if (cmax === r) {
            h = ((g - b) / delta) % 6;
            // Green is max
        } else if (cmax === g) {
            h = (b - r) / delta + 2;
            // Blue is max
        } else {
            h = (r - g) / delta + 4;
        }
        h = Math.round(h * 60);

        // Make negative hues positive behind 360°
        if (h < 0) {
            h += 360;
        }

        // Calculate lightness
        l = (cmax + cmin) / 2;

        // Calculate saturation
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

        // Multiply l and s by 100
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);

        const hsl = `hsl.${h}.${s}.${l}`;

        return hsl;
    }

    static mixColors(color1: Color, color2: Color): Color {
        return {
            r: Math.round((color1.r + color2.r) / 2),
            g: Math.round((color1.g + color2.g) / 2),
            b: Math.round((color1.b + color2.b) / 2),
        };
    }

    static stringToDate(dateString: string | null | undefined): Date | null {
        if (dateString != null) {
            const date = new Date(dateString);

            if (isNaN(date.getTime())) {
                throw new SyntaxError("Invalid date: " + dateString);
            } else {
                return date;
            }
        } else {
            return null;
        }
    }

    static dateToString(date: Date | null | undefined): string | null {
        if (date != null) {
            const isoString = date.toISOString();

            return isoString.substring(0, isoString.indexOf("T"));
        } else {
            return null;
        }
    }

    static arrayToMap<VT, KT>(
        array: VT[],
        keyFun: (value: VT) => KT,
    ): Map<KT, VT> {
        const result: Map<KT, VT> = new Map();
        for (const value of array) {
            result.set(keyFun(value), value);
        }
        return result;
    }

    static createReverseMap<X, Y>(
        map: Map<X, Y> | ImmutableMap<X, Y>,
    ): Map<Y, X> {
        return map["asImmutable"]
            ? Utils.getReverseMapOfImmutableMap(map as ImmutableMap<X, Y>)
            : Utils.getReverseMapOfMap(map as Map<X, Y>);
    }

    private static getReverseMapOfMap<X, Y>(map: Map<X, Y>): Map<Y, X> {
        return new Map(
            Array.from(map.entries()).map(([fromProp, toProp]) => [
                toProp,
                fromProp,
            ]),
        );
    }

    private static getReverseMapOfImmutableMap<K, V>(
        map: ImmutableMap<K, V>,
    ): Map<V, K> {
        const result = new Map<V, K>();
        map.forEach((value?: V, key?: K) => result.set(value as V, key as K));
        return result;
    }

    static async getJson(
        filePath: string,
        httpClient: HttpClient,
    ): Promise<any> {
        return httpClient
            .get(filePath)
            .toPromise()
            .then((response) => response)
            .catch(async (error) => Promise.reject(error));
    }

    static getProperty(data: any, path: string): any {
        if (data != null) {
            for (const propName of path.split(".")) {
                if (Object.prototype.hasOwnProperty.call(data, propName)) {
                    data = data[propName];
                } else {
                    return null;
                }
                if (data === null) {
                    return null;
                }
            }
        }
        return data;
    }

    static setProperty(rawData: any, propPath: string, value: any) {
        let container: any = rawData;
        const propNames: string[] = propPath.split(".");
        // eslint-disable-next-line one-var
        for (let i = 0, iMax = propNames.length - 1; i < iMax; i++) {
            if (
                !Object.prototype.hasOwnProperty.call(container, propNames[i])
            ) {
                container[propNames[i]] = {};
            }
            container = container[propNames[i]];
        }
        container[propNames[propNames.length - 1]] = value;
    }

    static getMatrix<T>(
        rowCount: number,
        columnCount: number,
        value: T,
    ): T[][] {
        const result: T[][] = [];
        for (let r = rowCount - 1; r >= 0; r--) {
            result[r] = new Array<T>(columnCount).fill(value);
        }
        return result;
    }

    static replaceAll(text: string, find: string, replace: string) {
        return text.replace(new RegExp(find, "g"), replace);
    }

    static getTranspose<T>(matrix: T[][]): T[][] {
        return matrix[0].map((col, i) => matrix.map((row) => row[i]));
    }

    /**
     * Partitions elements into groups according to the element key mapping.
     *
     * @param elements array of elements which shall be grouped
     * @param keyFn element to element key mapping
     */
    static getGroups<T>(
        elements: T[],
        keyFn: (t: T) => string,
    ): Map<string, T[]> {
        const result = new Map<string, T[]>();
        elements.forEach((e) => {
            const key: string = keyFn(e);
            const keyElements = result.get(key);
            if (keyElements) {
                keyElements.push(e);
            } else {
                result.set(key, [e]);
            }
        });
        return result;
    }

    static createObjectFromMap<T>(map: Map<string, T>): { [key: string]: T } {
        return _.fromPairs(Array.from(map.entries()));
    }

    static createObjectFromArray<V, X extends USwitch<W, V>, W>(
        arr: V[],
        keyMap: (v: V) => string,
        valueMap?: (v: V) => W,
    ): { [key: string]: X } {
        const result: { [key: string]: X } = {};
        if (valueMap) {
            for (const value of arr) {
                result[keyMap(value)] = valueMap(value) as unknown as X;
            }
        } else {
            for (const value of arr) {
                result[keyMap(value)] = value as unknown as X;
            }
        }
        return result;
    }

    static transformMap<K, V, TK, TV>(
        map: Map<K, V>,
        keyMapper: (k: K, v: V) => TK,
        valueMapper: (k: K, v: V) => TV,
    ): Map<TK, TV> {
        return new Map(
            Array.from(map.entries()).map(([k, v]) => [
                keyMapper(k, v),
                valueMapper(k, v),
            ]),
        );
    }

    static createSimpleStringSet(arr: string[]): { [key: string]: boolean } {
        const result: { [key: string]: boolean } = {};
        for (const value of arr) {
            result[value] = true;
        }
        return result;
    }

    static arrayFromSimpleStringSet(obj: { [key: string]: boolean }): string[] {
        return Object.keys(obj).filter((s) => obj[s]);
    }

    static compareStrings(a: string, b: string): number {
        if (a === null) {
            if (b === null) {
                return 0;
            } else {
                return -b.localeCompare(a);
            }
        } else {
            return a.localeCompare(b);
        }
    }

    static compareNumbers(a: number, b: number): number {
        return a === b ? 0 : a < b ? -1 : 1;
    }

    static groupRows<T>(
        rows: T[],
        keyFuns: ((t: T) => string | boolean | number)[],
    ): T[][] {
        const keyToIndicesMap: { [key: string]: number[] } = {};
        const nRows = rows.length;
        const nKeys = keyFuns.length;
        for (let iRow = 0; iRow < nRows; iRow++) {
            const keys: (string | boolean | number)[] = [];
            for (const keyFun of keyFuns) {
                keys.push(keyFun(rows[iRow]));
            }
            const key = JSON.stringify(keys);
            const indices = keyToIndicesMap[key];
            if (!indices) {
                keyToIndicesMap[key] = [iRow];
            } else {
                indices.push(iRow);
            }
        }
        const sortedKeys = Object.keys(keyToIndicesMap);
        const result: T[][] = [];
        for (const key of sortedKeys.sort()) {
            result.push(keyToIndicesMap[key].map((i) => rows[i]));
        }
        return result;
    }

    static groupDeliveriesByProduct(
        deliveries: DeliveryData[],
    ): DeliveryData[][] {
        return this.groupRows(deliveries, [
            (d) => d.originalSource,
            (d) => (d.name ? "PN:" + d.name : "DID:" + d.id),
        ]);
    }

    static groupDeliveriesByLot(deliveries: DeliveryData[]): DeliveryData[][] {
        const deliveryPGroups = Utils.groupDeliveriesByProduct(deliveries);
        const result: DeliveryData[][] = [];
        for (const deliveryPGroup of deliveryPGroups) {
            if (deliveryPGroup.length === 1) {
                result.push(deliveryPGroup);
            } else {
                result.push(
                    ...this.groupRows(deliveryPGroup, [(d) => d.lot ?? d.id]),
                );
            }
        }
        return result;
    }

    static getReversedRecord<K extends RecordKeyType, V extends RecordKeyType>(
        record: Record<K, V>,
    ): Record<V, K> {
        const result: Record<RecordKeyType, K> = {};
        const keys: K[] = Object.keys(record) as Array<K>;
        for (const key of keys) {
            result[record[key]] = key;
        }
        return result as Record<V, K>;
    }

    static mapRecordValues<K extends RecordKeyType, V, T>(
        record: Record<K, V>,
        mapFun: (v: V) => T,
    ): Record<K, T> {
        const result: Record<RecordKeyType, T> = {};
        const keys: K[] = Object.keys(record) as Array<K>;
        for (const key of keys) {
            result[key] = mapFun(record[key]);
        }
        return result as Record<K, T>;
    }

    static getStringArrayDifference(
        array1: string[],
        array2: string[],
    ): string[] {
        const elementToDeleteMap = this.createSimpleStringSet(array2);
        return array1.filter((e) => !elementToDeleteMap[e]);
    }

    static insertInOrder<T>(
        array: T[],
        defaultOrder: T[],
        newElements: T[],
    ): T[] {
        defaultOrder = defaultOrder.filter(
            (e) => array.includes(e) || newElements.includes(e),
        );
        newElements.forEach((newElement) => {
            const index = defaultOrder.indexOf(newElement);
            if (index < 0) {
                array.push(newElement);
            } else {
                array = ([] as T[]).concat(
                    array.slice(0, index),
                    [newElement],
                    array.slice(index),
                );
            }
        });
        return array;
    }
}

export function isEmptyString(value: any): value is "" {
    return typeof value === "string" && value === "";
}
