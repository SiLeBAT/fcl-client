import {
    DeliveryHighlightingRule, HighlightingRule, LinePatternType,
    StationHighlightingRule, TableColumn, TableRow
} from '../data.model';
import { PropToValuesMap } from './configuration.model';
import {
    ColorAndShapeEditRule, ColorEditRule, InvEditRule,
    LabelEditRule, RowFilter, RuleType, SimpleLabelEditRule
} from './model';
import * as _ from 'lodash';

export type EditRuleOfType<T extends RuleType> =
    T extends RuleType.LABEL ? LabelEditRule :
    T extends RuleType.COLOR_AND_SHAPE ? ColorAndShapeEditRule :
    T extends RuleType.COLOR ? ColorEditRule :
    T extends RuleType.INVISIBILITY ? InvEditRule : never;

export function filterTableRows(rows: TableRow[], rowFilters: RowFilter<any>[]): TableRow[] {
    let filteredRows = rows;
    for (const rowFilter of rowFilters) {
        filteredRows = rowFilter.filter(filteredRows);
    }
    return filteredRows;
}

export function extractPropToValuesMap(tableRows: TableRow[], tableColumns: TableColumn[]): PropToValuesMap {
    const propToValuesMap: PropToValuesMap = {};
    for (const column of tableColumns) {
        const values: string[] = _.uniq(
            tableRows
                .map(r => r[column.id] as (string | number | boolean))
                .filter(v => v !== undefined && v !== null)
                .map(v => typeof v === 'string' ? v : '' + v)
        ).sort();
        propToValuesMap[column.id] = values;
    }

    propToValuesMap[''] = _.uniq([].concat(...Object.values(propToValuesMap))).sort();

    return propToValuesMap;
}

export function isSimpleLabelRule(editRule: LabelEditRule): editRule is SimpleLabelEditRule {
    return (editRule as SimpleLabelEditRule).labelProperty !== undefined;
}

export function createDefaultHRule(): Omit<HighlightingRule, 'id' | 'name'> {
    return {
        userDisabled: false,
        autoDisabled: false,
        showInLegend: false,
        color: null,
        invisible: false,
        adjustThickness: false,
        labelProperty: null,
        valueCondition: null,
        logicalConditions: [[]]
    };
}

export function createDefaultStatHRule(): Omit<StationHighlightingRule, 'id' | 'name'> {
    return {
        ...createDefaultHRule(),
        shape: null
    };
}

export function createDefaultDelHRule(): Omit<DeliveryHighlightingRule, 'id' | 'name'> {
    return {
        ...createDefaultHRule(),
        linePattern: LinePatternType.SOLID
    };
}
