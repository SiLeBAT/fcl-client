import { Injectable } from '@angular/core';
import {
    BasicGraphState,
    TableColumn,
    StationTable,
    SelectedElements,
    MakeElementsInvisibleInputState,
    SetInvisibleElementsPayload,
    HighlightingSettings,
    ClearInvisibilitiesOptions,
    SetHighlightingSettingsPayload
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

    private getNewInvisibilities(oldInvIds: string[], updateInvIds: string[], invisible: boolean): string[] {
        if (updateInvIds.length === 0) {
            return oldInvIds;
        } else if (invisible) {
            return [].concat(oldInvIds, updateInvIds);
        } else {
            return Utils.getStringArrayDifference(oldInvIds, updateInvIds);
        }
    }

    private getNewSelection(oldSelection: string[], newInvIds: string[]): string[] {
        if (newInvIds.length === 0) {
            return oldSelection;
        } else {
            return Utils.getStringArrayDifference(oldSelection, newInvIds);
        }
    }

    getMakeElementsInvisiblePayload(
        state: MakeElementsInvisibleInputState,
        elements: SelectedElements
    ): SetInvisibleElementsPayload {

        const selectedElements = {
            stations: this.getNewSelection(state.selectedElements.stations, elements.stations),
            deliveries: this.getNewSelection(state.selectedElements.deliveries, elements.deliveries)
        };
        const tracingSettings = this.editTracSettingsService.resetObservedTypeForElements(state.tracingSettings, elements);

        return {
            selectedElements: selectedElements,
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
