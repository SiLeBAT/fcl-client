import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ComplexFilterCondition, ExtendedOperationType, JunktorType } from '../../../tracing/data.model';

interface Column {
    id: string;
    prop: string;
    name: string;

    comparator?: <T>(a: T, b: T) => number;
}

interface BasicFilter {
    filterText: string;
}

export interface Filter {
    filterText: string;
    filterProps: string[];
}

export interface FilterColumn extends Column, Filter { }

export interface ComplexFilter extends BasicFilter {
    filterConditions: ComplexFilterCondition[];
}

type ValueType = (number | string | boolean);

@Injectable({
    providedIn: 'root'
})
export class FilterService {
    static readonly COMPLEX_FILTER_NAME = 'ComplexFilter';

    private readonly OPERATION_TYPE_TO_FUNCTION_MAP: {
        [key: string]: (filterValue: ValueType, rowValue: ValueType) => boolean
    } = {
        [ExtendedOperationType.EQUAL]: this.areValuesEqual,
        [ExtendedOperationType.CONTAINS]: this.doesValueContain,
        [ExtendedOperationType.NOT_EQUAL]: this.areValuesNotEqual,
        [ExtendedOperationType.LESS]: this.isRowValueLessThanFilterValue,
        [ExtendedOperationType.GREATER]: this.isRowValueGreaterThanFilterValue,
        [ExtendedOperationType.REGEX_EQUAL]: this.isRowValueEqualToRegex,
        [ExtendedOperationType.REGEX_EQUAL_IGNORE_CASE]: this.isRowValueEqualToIgnoreCaseRegex,
        [ExtendedOperationType.REGEX_NOT_EQUAL]: this.isRowValueUnequalToRegex,
        [ExtendedOperationType.REGEX_NOT_EQUAL_IGNORE_CASE]: this.isRowValueUnequalToIgnoreCaseRegex
    };

    private standardFilterTermSubject = new BehaviorSubject<string>('');
    standardFilterTerm$: Observable<string> = this.standardFilterTermSubject
        .asObservable()
        .pipe(
            debounceTime(100),
            distinctUntilChanged()
        );

    constructor() { }

    processStandardFilterTerm(filterTerm: string) {
        this.standardFilterTermSubject.next(filterTerm);
    }

    filterRows(filters: Filter[], unfilteredRows: any[]): any[] {

        const filteredRows = unfilteredRows.filter(
            row => filters.every((filterElem: (Filter | ComplexFilter)) => {
                if (filterElem.filterText === null || filterElem.filterText === '') {
                    return true;
                } else if ((filterElem as ComplexFilter).filterText === FilterService.COMPLEX_FILTER_NAME) {
                    const complexFilterConditions: ComplexFilterCondition[] = (filterElem as ComplexFilter).filterConditions;
                    if (complexFilterConditions.length === 0) {
                        return true;
                    } else {
                        return this.complexFilterRow(row, complexFilterConditions);
                    }
                } else {
                    const filterText: string = filterElem.filterText.toLowerCase();

                    return (filterElem as Filter).filterProps.some(p => {
                        const propValue = row[p];
                        if (propValue === undefined || propValue === null) {
                            return false;
                        } else {
                            const strValue: string = typeof propValue === 'string' ?
                                propValue.toLowerCase() :
                                propValue.toString();

                            return strValue.includes(filterText);
                        }
                    });
                }
            })
        );

        return filteredRows;
    }

    private complexFilterRow(row: any, filterConditions: ComplexFilterCondition[]): boolean {
        const junktors: string[] = [];
        const rowResult: boolean = filterConditions.map((filterElement: ComplexFilterCondition) => {
                    const filterProperty: string = filterElement.property;
                    const operation: ExtendedOperationType = filterElement.operation;
                    const filterValue = filterElement.value;
                    junktors.push(filterElement.junktor);

                    const rowValue = row[filterProperty];
                    const func = this.OPERATION_TYPE_TO_FUNCTION_MAP[operation];
                    if (!func) {
                        throw new Error(`ExtendedOperationType ${operation} is not yet implemented for complex filter`);
                    }
                    const result: boolean = func(filterValue, rowValue);

                    return result;

                }).reduce((acc, next, index) => {
                    let result: boolean;
                    switch (junktors[index - 1]) {
                        case (JunktorType.AND):
                            result = acc && next;
                            break;
                        case (JunktorType.OR):
                            result = acc || next;
                            break;
                        default:
                            result = true;
                            break;
                    }

                    return result;
                });

        return rowResult;
    }

    private areValuesEqual(filterValue: ValueType, rowValue: ValueType): boolean {
        let result: boolean = false;

        if ((rowValue === undefined) || (rowValue === null)) {
            result = false;
        } else {
            const rowValueType = typeof rowValue;
            if (rowValueType === 'boolean') {
                result = (rowValue as boolean) === !!filterValue;
            } else if (rowValueType === 'string') {
                result = (filterValue as string).localeCompare(rowValue as string) === 0;
            } else if (rowValueType === 'number') {
                if (!isNaN(filterValue as any)) {
                    result = (rowValue as number) === +filterValue;
                }
            }
        }

        return result;
    }

    private doesValueContain(filterValue: ValueType, rowValue: ValueType): boolean {
        let result: boolean = false;

        if ((rowValue === undefined) || (rowValue === null)) {
            result = false;
        } else {
            const rowValueType = typeof rowValue;
            if (rowValueType === 'string') {
                result = (rowValue as string).toLowerCase().includes((filterValue as string).toLowerCase());
            } else {
                result = false;
            }
        }

        return result;
    }

    private areValuesNotEqual(filterValue: ValueType, rowValue: ValueType): boolean {
        let result: boolean = false;

        if ((rowValue === undefined) || (rowValue === null)) {
            result = false;
        } else {
            const rowValueType = typeof rowValue;
            if (rowValueType === 'boolean') {
                result = (rowValue as boolean) !== !!filterValue;
            } else if (rowValueType === 'string') {
                result = (filterValue as string).localeCompare(rowValue as string) !== 0;
            } else if (rowValueType === 'number') {
                if (!isNaN(filterValue as any)) {
                    result = (rowValue as number) !== +filterValue;
                }
            }
        }

        return result;
    }

    private isRowValueLessThanFilterValue(filterValue: ValueType, rowValue: ValueType): boolean {
        let result: boolean = false;

        if ((rowValue === undefined) || (rowValue === null)) {
            result = false;
        } else {
            const rowValueType = typeof rowValue;
            if (rowValueType === 'boolean') {
                result = !rowValue && !!filterValue;
            } else if (rowValueType === 'string') {
                result = (filterValue as string).localeCompare(rowValue as string) > 0;
            } else if (rowValueType === 'number') {
                if (!isNaN(filterValue as any)) {
                    result = (rowValue as number) < +filterValue;
                }
            }
        }

        return result;
    }

    private isRowValueGreaterThanFilterValue(filterValue: ValueType, rowValue: ValueType): boolean {
        let result: boolean = false;

        if ((rowValue === undefined) || (rowValue === null)) {
            result = false;
        } else {
            const rowValueType = typeof filterValue;
            if (rowValueType === 'boolean') {
                result = !!filterValue && !filterValue;
            } else if (rowValueType === 'string') {
                result = (filterValue as string).localeCompare(filterValue as string) < 0;
            } else if (rowValueType === 'number') {
                if (!isNaN(filterValue as any)) {
                    result = (filterValue as number) > +filterValue;
                }
            }
        }

        return result;
    }

    private isRowValueEqualToRegex(filterValue: ValueType, rowValue: ValueType): boolean {
        let result: boolean = false;

        if (rowValue === undefined) {
            result = false;
        } else if (rowValue === null) {
            result = (filterValue === '');
        } else {
            const strValue = (typeof rowValue === 'string') ? rowValue : rowValue.toString();
            if (filterValue === '') {
                result = (strValue === '');
            } else {
                const regExp = new RegExp(rowValue as string);
                result = !!regExp.exec(strValue);
            }

        }

        return result;
    }

    private isRowValueEqualToIgnoreCaseRegex(filterValue: ValueType, rowValue: ValueType): boolean {
        let result: boolean = false;

        if (rowValue === undefined) {
            result = false;
        } else if (rowValue === null) {
            result = (filterValue === '');
        } else {
            const strValue = (typeof rowValue === 'string') ? rowValue : rowValue.toString();
            if (filterValue === '') {
                result = (strValue === '');
            } else {
                const regExp = new RegExp((filterValue as string), 'i');
                result = !!regExp.exec(strValue);
            }

        }

        return result;
    }

    private isRowValueUnequalToRegex(filterValue: ValueType, rowValue: ValueType): boolean {
        let result: boolean = false;

        if (rowValue === undefined) {
            result = false;
        } else if (rowValue === null) {
            result = (filterValue !== '');
        } else {
            const strValue = (typeof rowValue === 'string') ? rowValue : rowValue.toString();
            if (filterValue === '') {
                result = (strValue !== '');
            } else {
                const regExp = new RegExp((filterValue as string));
                result = !regExp.exec(strValue);
            }

        }

        return result;
    }

    private isRowValueUnequalToIgnoreCaseRegex(filterValue: ValueType, rowValue: ValueType): boolean {
        let result: boolean = false;

        if (rowValue === undefined) {
            result = false;
        } else if (rowValue === null) {
            result = (filterValue !== '');
        } else {
            const strValue = (typeof rowValue === 'string') ? rowValue : rowValue.toString();
            if (filterValue === '') {
                result = (strValue !== '');
            } else {
                const regExp = new RegExp((filterValue as string), 'i');
                result = !regExp.exec(strValue);
            }

        }

        return result;
    }

}
