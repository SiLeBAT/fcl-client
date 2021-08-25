import { DataTable, LogicalCondition, TableColumn } from '@app/tracing/data.model';
import {
    ComplexFilterCondition, JunktorType, PropToValuesMap
} from '../configuration.model';
import * as _ from 'lodash';

type ConditionGroup = LogicalCondition[];
type SimpleValueType = string | number | boolean | undefined | null;

export class ComplexFilterUtils {

    static readonly DEFAULT_JUNKTOR_TYPE = JunktorType.AND;

    static extractDataColumns(dataTable: DataTable): TableColumn[] {
        return dataTable.columns.filter((tableColumn: TableColumn) => {
            return (tableColumn.id !== 'highlightingInfo');
        });
    }

    static extractPropToValuesMap(dataTable: DataTable, dataColumns: TableColumn[]): PropToValuesMap {
        const propToValuesMap: PropToValuesMap = {};
        for (const column of dataColumns) {
            const values: string[] = _.uniq(
                dataTable.rows
                    .map(r => r[column.id] as (string | number | boolean))
                    .filter(v => v !== undefined && v !== null)
                    .map(v => typeof v === 'string' ? v : '' + v)
                ).sort();
            propToValuesMap[column.id] = values;
        }
        propToValuesMap[''] = _.uniq([].concat(...Object.values(propToValuesMap))).sort();

        return propToValuesMap;
    }

    static complexFilterConditionsToLogicalConditions(filterConditions: ComplexFilterCondition[]): LogicalCondition[][] {
        const groups: ConditionGroup[] = [];
        let newGroup: ConditionGroup = [];

        for (const filterCondition of filterConditions) {
            const logicalCondition = {
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
                .filter(condition => ComplexFilterUtils.isConditionValid(condition))
                .sort(ComplexFilterUtils.conditionComparator))
            .filter(group => group.length > 0);

        return result.length === 0 ? [[]] : result;
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

    static logicalConditionsToComplexFilterConditions(conditions: LogicalCondition[][]): ComplexFilterCondition[] {

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
            propertyName: null,
            operationType: null,
            value: '',
            junktorType: this.DEFAULT_JUNKTOR_TYPE
        }];
    }
}
