import { Color, DataServiceInputState, NodeShapeType, TableColumn, TableRow } from '../data.model';
import { ComplexFilterCondition, PropToValuesMap } from './configuration.model';

export interface RowFilter<T> {
    filter(arr: TableRow[]): TableRow[];
    getSettings(): T;
}

export interface TextFilterSettings {
    filterTerm: string;
    filterProps: string[];
}

export enum TableType {
    STATIONS, DELIVERIES
}

export interface EditHighlightingServiceData {
    availableProperties: TableColumn[];
    propToValuesMap: PropToValuesMap;
    ruleListItems: RuleListItem[];
}

export interface RuleListItem {
    id: RuleId;
    name: string;
    color: Color | null;
    shape: NodeShapeType | null;
    showInLegend: boolean;
    disabled: boolean;
    effElementsCountTooltip: string;
    effElementsCount: number;
    conflictCount: number;
    ruleType: RuleType | null;
}
export interface EditRule {
    id: string;
    name: string;
    disabled: boolean;
    complexFilterConditions: ComplexFilterCondition[];
    type: RuleType;
    isValid: boolean;
}

export enum RuleType {
    INVISIBILITY, LABEL, COLOR_AND_SHAPE, COLOR
}

export interface ColorAndShapeEditRule extends EditRule {
    showInLegend: boolean;
    color: Color | null;
    shape: NodeShapeType | null;
}

export interface ColorEditRule extends EditRule {
    showInLegend: boolean;
    color: Color;
}

export interface LabelEditRule extends EditRule {
    showInLegend: boolean;
    labelProperty: string;
}

export interface InvEditRule extends EditRule {}

export type StationEditRule = ColorAndShapeEditRule | LabelEditRule | InvEditRule;
export type DeliveryEditRule = LabelEditRule | InvEditRule;

export type DeliveryRuleType = RuleType.LABEL | RuleType.COLOR;
export type StationRuleType = RuleType.LABEL | RuleType.COLOR_AND_SHAPE;

export type RuleId = string;

export interface EditHighlightingState<T extends EditRule> {
    dataServiceInputState: DataServiceInputState;
    editRules: T[];
}
