import { Injectable } from '@angular/core';
import {
    BasicGraphState,
    TableColumn,
    StationTable
} from '../data.model';
import { TableService } from '../services/table.service';

@Injectable({
    providedIn: 'root'
})
export class EditHighlightingService {

    private static readonly hiddenStationProps = ['selected', 'invisible'];

    constructor(private tableService: TableService) {}

    getStationData(state: BasicGraphState): StationTable {
        const dataTable = this.tableService.getStationData(state);

        return {
            ...dataTable,
            columns: this.filterStationColumns(dataTable.columns)
        };
    }

    private filterColumns(columns: TableColumn[], hiddenProps: string[]): TableColumn[] {
        return columns.filter(
            column => hiddenProps.indexOf(column.id) < 0
        );
    }

    private filterStationColumns(columns: TableColumn[]): TableColumn[] {
        return this.filterColumns(columns, EditHighlightingService.hiddenStationProps);
    }
}
