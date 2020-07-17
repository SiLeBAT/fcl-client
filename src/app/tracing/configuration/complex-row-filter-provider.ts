import { RowFilter } from './model';
import * as _ from 'lodash';
import { TableRow } from '../data.model';
import { createOperatorFun } from './operator-provider';
import { ExtendedOperationType, ComplexRowFilterSettings, LogicalFilterCondition, JunktorType } from './configuration.model';

type FilterFun = (rows: TableRow[]) => TableRow[];

type SimpleValueType = string | number | boolean | undefined | null;

interface InternalLogicalFilterCondition {
    property: string;
    operation: ExtendedOperationType;
    value: string | number | boolean;
}

interface PreprocessedCondition {
    property: string;
    isValid(value: SimpleValueType): boolean;
}

type ConditionGroup = InternalLogicalFilterCondition[];

export type ComplexRowFilter = RowFilter<ConditionGroup[]>;

function isConditionValid(condition: InternalLogicalFilterCondition): boolean {
    return (
        condition.property &&
        condition.operation &&
        (
            (condition.value !== null && condition.value !== undefined) ||
            condition.operation in [ExtendedOperationType.EQUAL, ExtendedOperationType.NOT_EQUAL]
        )
    );
}

function valueToStr(value: SimpleValueType): string {
    if (value === undefined || value === null) {
        return '';
    } else {
        return (
            typeof value === 'string'
                ? value
                : value.toString()
        );
    }
}

function conditionComparator(con1: InternalLogicalFilterCondition, con2: InternalLogicalFilterCondition): number {
    if (con1.property !== con2.property) {
        return con1.property.localeCompare(con2.property);
    } else if (con1.operation !== con2.operation) {
        return con1.operation.localeCompare(con2.operation);
    } else {
        const val1 = valueToStr(con1.value);
        const val2 = valueToStr(con2.value);
        if (val1 !== val2) {
            return val1.localeCompare(val2);
        } else {
            return 0;
        }
    }
}

function groupConditions(conditions: LogicalFilterCondition[]): ConditionGroup[] {
    const groups: ConditionGroup[] = [];
    let newGroup: ConditionGroup = [];

    for (const condition of conditions) {
        newGroup.push(condition);
        if (condition.junktor === JunktorType.OR) {
            groups.push(newGroup);
            newGroup = [];
        }
    }
    if (newGroup.length > 0) {
        groups.push(newGroup);
    }

    return groups
        .map(group => group.filter(condition => isConditionValid(condition)).sort(conditionComparator))
        .filter(group => group.length > 0);
}

function createPreprocessedCondition(condition: InternalLogicalFilterCondition): PreprocessedCondition {
    return {
        property: condition.property,
        isValid: createOperatorFun(condition.operation, condition.value)
    };
}

function createPreprocessedConditions(conditionGroups: ConditionGroup[]): PreprocessedCondition[][] {
    return conditionGroups.map(group => group.map(createPreprocessedCondition));
}

export function createComplexRowFilter(settings: ComplexRowFilterSettings): ComplexRowFilter {
    const conditionGroups = groupConditions(settings.conditions);
    let filterFun: FilterFun;
    if (conditionGroups.length === 0) {
        filterFun = (rows: TableRow[]) => rows;
    } else {
        const ppGroups = createPreprocessedConditions(conditionGroups);
        filterFun = (rows: TableRow[]) => rows.filter(
            row => ppGroups.some(ppGroup => ppGroup.every(ppCon => ppCon.isValid(row[ppCon.property] as SimpleValueType)))
        );
    }
    return {
        filter: filterFun,
        getSettings: () => conditionGroups
    };
}

export function getUpdatedComplexRowFilter(
    settings: ComplexRowFilterSettings,
    rowFilter: ComplexRowFilter
): ComplexRowFilter {
    if (rowFilter) {
        const conditionGroups = groupConditions(settings.conditions);
        if (_.isEqual(conditionGroups, rowFilter.getSettings())) {
            return rowFilter;
        }
    }
    return createComplexRowFilter(settings);
}
