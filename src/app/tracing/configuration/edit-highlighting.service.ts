import { Injectable } from '@angular/core';
import {
    TableColumn,
    StationTable,
    SelectedElements,
    MakeElementsInvisibleInputState,
    SetInvisibleElementsPayload,
    HighlightingSettings,
    ClearInvisibilitiesOptions,
    SetHighlightingSettingsPayload,
    DataServiceInputState
} from '../data.model';
import { EditTracingSettingsService } from '../services/edit-tracing-settings.service';
import { TableService } from '../services/table.service';
import { Utils } from '../util/non-ui-utils';

@Injectable({
    providedIn: 'root'
})
export class EditHighlightingService {

    private static readonly hiddenStationProps = ['selected', 'invisible'];

    constructor(
        private tableService: TableService,
        private editTracSettingsService: EditTracingSettingsService
    ) {}

    getStationData(state: DataServiceInputState): StationTable {
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

    private getNewInvisibilities(oldInvIds: string[], updateInvIds: string[], invisible: boolean): string[] {
        if (updateInvIds.length === 0) {
            return oldInvIds;
        } else if (invisible) {
            return [].concat(oldInvIds, updateInvIds);
        } else {
            return Utils.getStringArrayDifference(oldInvIds, updateInvIds);
        }
    }

    getMakeElementsInvisiblePayload(
        state: MakeElementsInvisibleInputState,
        elements: SelectedElements
    ): SetInvisibleElementsPayload {

        const tracingSettings = this.editTracSettingsService.resetObservedTypeForElements(state.tracingSettings, elements);

        return {
            tracingSettings: tracingSettings,
            highlightingSettings: {
                ...state.highlightingSettings,
                invisibleStations: this.getNewInvisibilities(
                    state.highlightingSettings.invisibleStations,
                    elements.stations,
                    true
                ),
                invisibleDeliveries: this.getNewInvisibilities(
                    state.highlightingSettings.invisibleDeliveries,
                    elements.deliveries,
                    true
                )
            }
        };
    }

    getClearInvisiblitiesPayload(
        state: HighlightingSettings,
        options: ClearInvisibilitiesOptions
    ): SetHighlightingSettingsPayload {
        if (options.clearDeliveryInvs || options.clearStationInvs) {
            return {
                highlightingSettings: {
                    ...state,
                    invisibleStations: options.clearStationInvs ? [] : state.invisibleStations,
                    invisibleDeliveries: options.clearDeliveryInvs ? [] : state.invisibleDeliveries
                }
            };
        }
        return null;
    }

}
