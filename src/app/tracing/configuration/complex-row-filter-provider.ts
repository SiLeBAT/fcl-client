import { RowFilter } from './model';
import * as _ from 'lodash';
import { LogicalCondition, TableRow } from '../data.model';
import { createOperatorFun } from './operator-provider';
import { ComplexFilterCondition, ComplexRowFilterSettings, JunktorType } from './configuration.model';

type FilterFun = (rows: TableRow[]) => TableRow[];

type SimpleValueType = string | number | boolean | undefined | null;

interface PreprocessedCondition {
    property: string;
    isValid(value: SimpleValueType): boolean;
}

export type ComplexRowFilter = RowFilter<LogicalCondition[][]>;

function isConditionValid(condition: LogicalCondition): boolean {
    return (
        condition.propertyName &&
        condition.operationType !== undefined &&
        condition.value !== null && condition.value !== undefined && condition.value !== ''
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

function conditionComparator(con1: LogicalCondition, con2: LogicalCondition): number {
    if (con1.propertyName !== con2.propertyName) {
        return con1.propertyName.localeCompare(con2.propertyName);
    } else if (con1.operationType !== con2.operationType) {
        return con1.operationType.localeCompare(con2.operationType);
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

function groupConditions(conditions: ComplexFilterCondition[]): ComplexFilterCondition[][] {
    const groups: ComplexFilterCondition[][] = [];
    let newGroup: ComplexFilterCondition[] = [];

    for (const condition of conditions) {
        if (condition.operationType !== null && condition.propertyName !== null) {
            newGroup.push(condition);
        }

        if (condition.junktorType === JunktorType.OR) {
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

function createPreprocessedCondition(condition: LogicalCondition): PreprocessedCondition {
    return {
        property: condition.propertyName,
        isValid: createOperatorFun(condition.operationType, condition.value)
    };
}

export function createPreprocessedConditions(conditionGroups: LogicalCondition[][]): PreprocessedCondition[][] {
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
