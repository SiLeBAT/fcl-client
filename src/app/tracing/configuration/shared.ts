import { TableColumn, TableRow } from '../data.model';
import { PropToValuesMap } from './configuration.model';
import { RowFilter } from './model';
import * as _ from 'lodash';

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
