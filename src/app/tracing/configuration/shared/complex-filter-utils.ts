import { DataTable, LogicalCondition, TableColumn } from '@app/tracing/data.model';
import { ComplexFilterCondition, JunktorType } from '../configuration.model';
import { RequiredPick } from '@app/tracing/util/utility-types';

type SimpleValueType = string | number | boolean | undefined | null;

export function isConditionValid(condition: Partial<LogicalCondition>): condition is LogicalCondition;
export function isConditionValid(condition: ComplexFilterCondition): condition is RequiredPick<ComplexFilterCondition, 'operationType' | 'value' | 'propertyName'>;
export function isConditionValid(condition: Partial<LogicalCondition>): boolean {
    return (
        condition.propertyName != null &&
        condition.operationType != null &&
        condition.value !== null && condition.value !== undefined && condition.value !== ''
    );
}

export function conditionComparator(con1: LogicalCondition, con2: LogicalCondition): number {
    if (con1.propertyName !== con2.propertyName) {
        return con1.propertyName.localeCompare(con2.propertyName);
    } else if (con1.operationType !== con2.operationType) {
        return con1.operationType.localeCompare(con2.operationType);
    } else {
        if (con1.value !== con2.value) {
            return con1.value.localeCompare(con2.value);
        } else {
            return 0;
        }
    }
}

export class ComplexFilterUtils {

    static readonly DEFAULT_JUNKTOR_TYPE = JunktorType.AND;

    static extractDataColumns(dataTable: DataTable): TableColumn[] {
        return dataTable.columns.filter((tableColumn: TableColumn) => (tableColumn.id !== 'highlightingInfo'));
    }

    static complexFilterConditionsToLogicalConditions(filterConditions: ComplexFilterCondition[]): LogicalCondition[][] {
        const groups: Partial<LogicalCondition>[][] = [];
        let newGroup: Partial<LogicalCondition>[] = [];

        for (const filterCondition of filterConditions) {
            const logicalCondition: Partial<LogicalCondition> = {
                propertyName: filterCondition.propertyName,
                operationType: filterCondition.operationType,
                value: filterCondition.value
            };
            newGroup.push(logicalCondition);
            if (filterCondition.junktorType === JunktorType.OR) {
                groups.push(newGroup);
                newGroup = [];
            }
        }
        if (newGroup.length > 0) {
            groups.push(newGroup);
        }

        const result = groups
            .map(group => group
                .filter<LogicalCondition>(isConditionValid)
                .sort(conditionComparator))
            .filter(group => group.length > 0);

        return result.length === 0 ? [[]] : result;
    }

    static valueToStr(value: SimpleValueType): string {
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

    static logicalConditionsToComplexFilterConditions(conditions: LogicalCondition[][] | null): ComplexFilterCondition[] {

        conditions = conditions || [[]];
        const filterConditions: ComplexFilterCondition[] = [];

        for (const andConditions of conditions) {
            if (andConditions.length > 0) {
                for (const andCondition of andConditions) {
                    const filterCondition: ComplexFilterCondition = {
                        ...andCondition,
                        junktorType: JunktorType.AND
                    };
                    if (andCondition === andConditions[andConditions.length - 1]) {
                        filterCondition.junktorType = JunktorType.OR;
                    }
                    filterConditions.push(filterCondition);
                }
            }
        }

        return filterConditions;

    }

    static createDefaultComplexFilterConditions(): ComplexFilterCondition[] {
        return [{
            value: '',
            junktorType: this.DEFAULT_JUNKTOR_TYPE
        }];
    }
}
