import { TableRow, ObservedType } from '../data.model';
import { RowFilter } from './model';
import * as _ from 'lodash';
import * as complexFilterProvider from './complex-row-filter-provider';
import { ColumnFilterSettings, ShowType, VisibilityFilterState, ComplexRowFilterSettings } from './configuration.model';

type FilterFun = (rows: TableRow[]) => TableRow[];

type SimpleValueType = string | number | boolean | undefined | null;

interface OneTermForNColumnsRowFilterSettings {
    filterTerm: string;
    filterProps: string[];
}

type OneTermForEachColumnRowFilterSettings = ColumnFilterSettings[];

export type OneTermForNColumnsRowFilter = RowFilter<OneTermForNColumnsRowFilterSettings>;
export type OneTermForEachColumnRowFilter = RowFilter<OneTermForEachColumnRowFilterSettings>;
export type ComplexRowFilter = complexFilterProvider.ComplexRowFilter;
export type PredefinedRowFilter = RowFilter<ShowType>;
export type VisibilityRowFilter = RowFilter<VisibilityFilterState>;

function isInfix(infix: string, value: SimpleValueType): boolean {
    if (value === undefined || value === null) {
        return false;
    } else {
        const strValue: string =
            typeof value === 'string'
                ? value.toLowerCase()
                : value.toString();

        return strValue.includes(infix);
    }
}

export function createOneTermForNColumnsRowFilter(filterTerm: string, filterProps: string[]): OneTermForNColumnsRowFilter {
    let filter: FilterFun;
    const infix = filterTerm ? filterTerm.toLowerCase() : '';
    filterProps = filterProps.filter(p => !!p).sort();

    if (!filterTerm || filterProps.length === 0) {
        filter = (rows: TableRow[]) => rows;
    } else {
        filter = (rows: TableRow[]) => rows.filter(r => filterProps.some(p => isInfix(infix, r[p] as SimpleValueType)));
    }
    const settings: OneTermForNColumnsRowFilterSettings = {
        filterTerm: infix,
        filterProps: filterProps
    };
    return {
        filter: filter,
        getSettings: () => settings
    };
}

export function getUpdatedOneTermForNColumnsRowFilter(
    filterTerm: string,
    filterProps: string[],
    rowFilter: OneTermForNColumnsRowFilter
): OneTermForNColumnsRowFilter {

    if (rowFilter) {
        const oldSettings = rowFilter.getSettings();

        filterProps = filterProps.filter(p => !!p).sort();
        filterTerm = (filterTerm || '').toLowerCase();

        if (
            oldSettings.filterTerm === filterTerm &&
            _.isEqual(oldSettings.filterProps, filterProps)
        ) {
            return rowFilter;
        }
    }
    return createOneTermForNColumnsRowFilter(filterTerm, filterProps);
}

export function createOneTermForEachColumnRowFilter(filterSettings: ColumnFilterSettings[]): OneTermForEachColumnRowFilter {
    let filter: FilterFun;
    filterSettings = filterSettings
        .filter(f => !!f.filterTerm)
        .map(f => ({ filterTerm: f.filterTerm.toLowerCase(), filterProp: f.filterProp }))
        .sort((f1, f2) => f1.filterTerm.localeCompare(f2.filterTerm));

    if (filterSettings.length === 0) {
        filter = (rows: TableRow[]) => rows;
    } else {
        filter = (rows: TableRow[]) => rows.filter(
            r => filterSettings.every(f => isInfix(f.filterTerm, r[f.filterProp] as SimpleValueType))
        );
    }

    return {
        filter: filter,
        getSettings: () => filterSettings
    };
}

export function createPredefinedRowFilter(showType: ShowType): PredefinedRowFilter {
    let filterFun: FilterFun;
    if (showType === ShowType.ALL) {
        filterFun = (rows: TableRow[]) => rows;
    } else if (showType === ShowType.SELECTED_ONLY) {
        filterFun = (rows: TableRow[]) => rows.filter(r => r['selected']);
    } else {
        filterFun = (rows: TableRow[]) => rows.filter(r => r['forward'] || r['backward'] || r['observed'] !== ObservedType.NONE);
    }
    return {
        filter: filterFun,
        getSettings: () => showType
    };
}

export function createComplexRowFilter(
    settings: ComplexRowFilterSettings,
    ignoredProps: string[]
): complexFilterProvider.ComplexRowFilter {
    return complexFilterProvider.createComplexRowFilter(settings, ignoredProps);
}

export function getUpdatedComplexRowFilter(
    settings: ComplexRowFilterSettings,
    ignoredProps: string[],
    rowFilter: complexFilterProvider.ComplexRowFilter
): complexFilterProvider.ComplexRowFilter {
    return complexFilterProvider.getUpdatedComplexRowFilter(settings, ignoredProps, rowFilter);
}

export function createVisibilityRowFilter(visibilityState: VisibilityFilterState): VisibilityRowFilter {
    let filterFun: FilterFun;
    if (visibilityState === VisibilityFilterState.SHOW_ALL) {
        filterFun = (rows: TableRow[]) => rows;
    } else {
        const invisible = visibilityState === VisibilityFilterState.SHOW_INVISIBLE_ONLY;
        filterFun = (rows: TableRow[]) => rows.filter(r => r['invisible'] === invisible);
    }
    return {
        filter: filterFun,
        getSettings: () => visibilityState
    };
}
