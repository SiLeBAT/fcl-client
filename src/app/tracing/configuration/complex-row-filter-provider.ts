import { RowFilter } from "./model";
import * as _ from "lodash";
import { LogicalCondition, TableRow } from "../data.model";
import { createOperatorFun } from "./operator-provider";
import {
    ComplexFilterCondition,
    ComplexRowFilterSettings,
    JunktorType,
} from "./configuration.model";
import {
    conditionComparator,
    isConditionValid,
} from "./shared/complex-filter-utils";

type FilterFun = (rows: TableRow[]) => TableRow[];

type SimpleValueType = string | number | boolean | undefined | null;

interface PreprocessedCondition {
    property: string;
    isValid(value: SimpleValueType): boolean;
}

export type ComplexRowFilter = RowFilter<LogicalCondition[][]>;

function groupConditions(
    conditions: ComplexFilterCondition[],
    ignoredProps: string[],
): LogicalCondition[][] {
    const groups: ComplexFilterCondition[][] = [];
    let newGroup: ComplexFilterCondition[] = [];

    for (const condition of conditions) {
        if (
            condition.operationType != null &&
            condition.propertyName != null &&
            !ignoredProps.includes(condition.propertyName)
        ) {
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
        .map((group) =>
            group.filter(isConditionValid).sort(conditionComparator),
        )
        .filter((group) => group.length > 0);
}

function createPreprocessedCondition(
    condition: LogicalCondition,
): PreprocessedCondition {
    return {
        property: condition.propertyName,
        isValid: createOperatorFun(condition.operationType, condition.value),
    };
}

export function createPreprocessedConditions(
    conditionGroups: LogicalCondition[][],
): PreprocessedCondition[][] {
    return conditionGroups.map((group) =>
        group.map(createPreprocessedCondition),
    );
}

export function createComplexRowFilter(
    settings: ComplexRowFilterSettings,
    ignoredProps: string[],
): ComplexRowFilter {
    const conditionGroups = groupConditions(settings.conditions, ignoredProps);
    let filterFun: FilterFun;
    if (conditionGroups.length === 0) {
        filterFun = (rows: TableRow[]) => rows;
    } else {
        const ppGroups = createPreprocessedConditions(conditionGroups);
        filterFun = (rows: TableRow[]) =>
            rows.filter((row) =>
                ppGroups.some((ppGroup) =>
                    ppGroup.every((ppCon) =>
                        ppCon.isValid(row[ppCon.property] as SimpleValueType),
                    ),
                ),
            );
    }
    return {
        filter: filterFun,
        getSettings: () => conditionGroups,
    };
}

export function getUpdatedComplexRowFilter(
    settings: ComplexRowFilterSettings,
    ignoredProps: string[],
    rowFilter?: ComplexRowFilter,
): ComplexRowFilter {
    if (rowFilter) {
        const conditionGroups = groupConditions(
            settings.conditions,
            ignoredProps,
        );
        if (_.isEqual(conditionGroups, rowFilter.getSettings())) {
            return rowFilter;
        }
    }
    return createComplexRowFilter(settings, ignoredProps);
}
