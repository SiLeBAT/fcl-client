import { DataTable, LogicalCondition, OperationType, TableColumn } from '@app/tracing/data.model';
import {
    ComplexFilterCondition, ExtendedOperationType, JunktorType, LogicalFilterCondition, PropToValuesMap
} from '../configuration.model';
import { Utils } from '@app/tracing/util/non-ui-utils';
import * as _ from 'lodash';

type ConditionGroup = LogicalCondition[];
type SimpleValueType = string | number | boolean | undefined | null;

export class ComplexFilterUtils {

    static readonly DEFAULT_JUNKTOR = JunktorType.AND;

    private static opTypeToExtOpTypeMap: Record<OperationType, ExtendedOperationType> = {
        [OperationType.EQUAL]: ExtendedOperationType.EQUAL,
        [OperationType.GREATER]: ExtendedOperationType.GREATER,
        [OperationType.LESS]: ExtendedOperationType.LESS,
        [OperationType.NOT_EQUAL]: ExtendedOperationType.NOT_EQUAL,
        [OperationType.REGEX_EQUAL]: ExtendedOperationType.REGEX_EQUAL,
        [OperationType.REGEX_EQUAL_IGNORE_CASE]: ExtendedOperationType.REGEX_EQUAL_IGNORE_CASE,
        [OperationType.REGEX_NOT_EQUAL]: ExtendedOperationType.REGEX_NOT_EQUAL,
        [OperationType.REGEX_NOT_EQUAL_IGNORE_CASE]: ExtendedOperationType.REGEX_NOT_EQUAL_IGNORE_CASE

    };

    private static extOpTypeToOpTypeMap: Record<ExtendedOperationType, OperationType> =
        Utils.getReversedRecord(ComplexFilterUtils.opTypeToExtOpTypeMap);

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

    static complexFilterConditionsToLogicalConditions(filterConditions: LogicalFilterCondition[]): LogicalCondition[][] {
        const groups: ConditionGroup[] = [];
        let newGroup: ConditionGroup = [];

        for (const filterCondition of filterConditions) {
            const opType = (
                filterCondition.operation !== null ?
                this.extOpTypeToOpTypeMap[filterCondition.operation] :
                null
            );
            const logicalCondition = {
                propertyName: filterCondition.property,
                operationType: opType,
                value: filterCondition.value as string
            };
            newGroup.push(logicalCondition);
            if (filterCondition.junktor === JunktorType.OR) {
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

    static logicalConditionsToComplexFilterConditions(conditions: LogicalCondition[][]): ComplexFilterCondition[] {

        const filterConditions: ComplexFilterCondition[] = [];

        for (const andConditions of conditions) {
            if (andConditions.length > 0) {
                for (const andCondition of andConditions) {
                    const filterCondition: ComplexFilterCondition = {
                        property: andCondition.propertyName,
                        operation: ComplexFilterUtils.opTypeToExtOpTypeMap[andCondition.operationType],
                        value: andCondition.value,
                        junktor: JunktorType.AND
                    };
                    if (andCondition === andConditions[andConditions.length - 1]) {
                        filterCondition.junktor = JunktorType.OR;
                    }
                    filterConditions.push(filterCondition);
                }
            }
        }
        if (filterConditions.length === 0) {
            filterConditions.push({
                property: null,
                operation: null,
                value: '',
                junktor: JunktorType.AND
            });
        } else {
            filterConditions[filterConditions.length - 1].junktor = JunktorType.AND;
        }

        return filterConditions;

    }

    static createDefaultFilterConditions(): ComplexFilterCondition[] {
        return [{
            property: undefined,
            operation: undefined,
            value: '',
            junktor: this.DEFAULT_JUNKTOR
        }];
    }
}
