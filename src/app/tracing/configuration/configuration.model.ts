import { DataTable, OperationType } from '../data.model';
import { RuleId, StationEditRule } from './model';

export type FilterTabId = 'filterTab';
export type HighlightingTabId = 'highlightingTab';
export type SettingsTabId = 'settingsTab';
export type StationsTabId = 'stationsTab';
export type DeliveriesTabId = 'deliveriesTab';
export type ActiveConfigurationTabId = FilterTabId | HighlightingTabId | SettingsTabId;
type DeliveriesOrStationsTabId = StationsTabId | DeliveriesTabId;
export type ActiveFilterTabId = DeliveriesOrStationsTabId;
export type ActiveHighlightingTabId = DeliveriesOrStationsTabId;

export type AddTypedId<T, IT> = T & { id: IT };

export interface ConfigurationTabIndex {
    activeConfigurationTabId: ActiveConfigurationTabId;
    activeFilterTabId: ActiveFilterTabId;
    activeHighlightingTabId: ActiveHighlightingTabId;
}
export interface ComplexFilterCondition {
    propertyName: string | null;
    operationType: OperationType | null;
    value: string;
    junktorType: JunktorType;
}

export interface ComplexRowFilterSettings {
    conditions: ComplexFilterCondition[];
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

export interface HighlightingConfigurationSettings {
    stationEditRules: StationEditRule[];
}

export type PropToValuesMap = Record<string, string[]>;

export interface ColorsAndShapesEditInputData {
    dataTable: DataTable;
    complexFilterSettings: ComplexRowFilterSettings;
}

export interface ColorsAndShapesInputData extends ColorsAndShapesEditInputData {
    editIndex: number;
}
export interface HighlightingRuleDeleteRequestData {
    ruleId: RuleId;
    xPos: number;
    yPos: number;
}

export enum ShowType {
    ALL = 'Show all' as any,
    SELECTED_ONLY = 'Show only selected' as any,
    TRACE_ONLY = 'Show only traced' as any
}

export enum JunktorType {
    AND = 'And',
    OR = 'Or'
}
