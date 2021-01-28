import { DataTable, LogicalCondition, OperationType, TableColumn } from '@app/tracing/data.model';
import { JunktorType, LogicalFilterCondition, PropValueMap } from '../configuration.model';
import * as _ from 'lodash';

type ConditionGroup = LogicalCondition[];
type SimpleValueType = string | number | boolean | undefined | null;

export class ComplexFilterUtils {

    static extractDataColumns(dataTable: DataTable): TableColumn[] {
        return dataTable.columns.filter((tableColumn: TableColumn) => {
            return (tableColumn.id !== 'highlightingInfo');
        });
    }

    static extractPropValueMap(dataTable: DataTable, dataColumns: TableColumn[]): PropValueMap {
        const propToValuesMap: PropValueMap = {};
        for (const column of dataColumns) {
            const values = _.uniq(
                dataTable.rows
                    .map(r => r[column.id] as (string | number | boolean))
                    .filter(v => v !== undefined && v !== null)
                ).sort();
            propToValuesMap[column.id] = values;
        }
        propToValuesMap[''] = _.uniq([].concat(...Object.values(propToValuesMap))).sort();

        return propToValuesMap;
    }

    static groupConditions(conditions: LogicalFilterCondition[]): LogicalCondition[][] {
        const groups: ConditionGroup[] = [];
        let newGroup: ConditionGroup = [];

        for (const condition of conditions) {
            const logicalCondition = {
                propertyName: condition.property,
                operationType: condition.operation as unknown as OperationType,
                value: condition.value as string
            };
            newGroup.push(logicalCondition);
            if (condition.junktor === JunktorType.OR) {
                groups.push(newGroup);
                newGroup = [];
            }
        }
        if (newGroup.length > 0) {
            groups.push(newGroup);
        }

        return groups
            .map(group => group
                .filter(condition => ComplexFilterUtils.isConditionValid(condition))
                .sort(ComplexFilterUtils.conditionComparator))
            .filter(group => group.length > 0);
    }

    static isConditionValid(condition: LogicalCondition): boolean {
        return (
            condition.propertyName &&
            condition.operationType &&
            condition.value !== null && condition.value !== undefined && condition.value !== ''
        );
    }

    static conditionComparator(con1: LogicalCondition, con2: LogicalCondition): number {
        if (con1.propertyName !== con2.propertyName) {
            return con1.propertyName.localeCompare(con2.propertyName);
        } else if (con1.operationType !== con2.operationType) {
            return con1.operationType.localeCompare(con2.operationType);
        } else {
            const val1 = ComplexFilterUtils.valueToStr(con1.value);
            const val2 = ComplexFilterUtils.valueToStr(con2.value);
            if (val1 !== val2) {
                return val1.localeCompare(val2);
            } else {
                return 0;
            }
        }
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
}
