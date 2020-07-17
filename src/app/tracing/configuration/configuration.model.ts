export interface ConfigurationTabIndex {
    activeMainTabIndex: number;
    activeFilterTabIndex: number;
    activeHighlightingTabIndex: number;
}

export interface LogicalFilterCondition {
    property: string;
    operation: ExtendedOperationType;
    value: string | number | boolean;
    junktor: JunktorType;
}

export interface ComplexFilterCondition {
    property: string;
    operation: ExtendedOperationType;
    value: string | number | boolean;
    junktor: JunktorType;
}

export interface ComplexRowFilterSettings {
    conditions: LogicalFilterCondition[];
}

export interface ColumnFilterSettings {
    filterTerm: string;
    filterProp: string;
}

export enum VisibilityFilterState {
    SHOW_ALL,
    SHOW_VISIBLE_ONLY,
    SHOW_INVISIBLE_ONLY
}

export interface FilterTableSettings {
    columnOrder: string[];

    standardFilter: string;
    predefinedFilter: ShowType;
    complexFilter: ComplexRowFilterSettings;

    visibilityFilter: VisibilityFilterState;
    columnFilters: ColumnFilterSettings[];
}

export interface FilterSettings {
    stationFilter: FilterTableSettings;
    deliveryFilter: FilterTableSettings;
}

export enum ShowType {
    ALL = 'Show all' as any,
    SELECTED_ONLY = 'Show only selected' as any,
    TRACE_ONLY = 'Show only traced' as any
}

export enum ExtendedOperationType {
    EQUAL = '==',
    CONTAINS = 'contains',
    GREATER = '>',
    NOT_EQUAL = '!=',
    LESS = '<',
    REGEX_EQUAL = '== (Regex)',
    REGEX_NOT_EQUAL = '!= (Regex)',
    REGEX_EQUAL_IGNORE_CASE = '== (Regex Ignore Case)',
    REGEX_NOT_EQUAL_IGNORE_CASE = '!= (Regex Ignore Case)'
}

export enum JunktorType {
    AND = 'And',
    OR = 'Or'
}
