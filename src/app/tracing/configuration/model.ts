import { Color, NodeShapeType, TableRow } from '../data.model';
import { ComplexFilterCondition } from './configuration.model';

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

export interface HighlightingListItem {
    id: RuleId;
    name: string;
    editRule: EditRule | null;
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
    INVISIBILITY, LABEL, COLOR_AND_SHAPE
}

export interface ColorAndShapeEditRule extends EditRule {
    showInLegend: boolean;
    color: Color | null;
    shape: NodeShapeType | null;
}

export interface LabelEditRule extends EditRule {
    showInLegend: boolean;
    labelProperty: string;
}

export interface InvEditRule extends EditRule {}

export type StationEditRule = ColorAndShapeEditRule | LabelEditRule | InvEditRule;

export type RuleId = string;

export interface StationEditRules {
    colorAndShapeRule: ColorAndShapeEditRule | null;
}
