import { TableRow } from '../data.model';
import { RowFilter } from './model';

export function filterTableRows(rows: TableRow[], rowFilters: RowFilter<any>[]): TableRow[] {
    let filteredRows = rows;
    for (const rowFilter of rowFilters) {
        filteredRows = rowFilter.filter(filteredRows);
    }
    return filteredRows;
}
